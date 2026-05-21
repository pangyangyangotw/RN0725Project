import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TouchableHighlight,
    Image,
    FlatList
} from 'react-native';
import SuperView from '../../super/SuperView';
import Util from '../../util/Util';
import I18nUtil from '../../util/I18nUtil';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import InflFlightService from '../../service/InflFlightService';
import NetworkFaildView from '../../custom/NetWorkFaildView';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import IntlFlightEnum from "../../enum/IntlFlightEnum";
import CropImage from '../../custom/CropImage';
import { connect } from 'react-redux';
import Action from '../../redux/action';
import Foundation from 'react-native-vector-icons/Foundation';
import Key from '../../res/styles/Key';
import StorageUtil from '../../util/StorageUtil';

/**
 * 往返 返程 国际机票列表
 */
class IntlFlightRtListScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._tabBarBottomView = {
            bottomInset: true,
            bottomColor: 'white'
        }
        const { queryModel, isRt, goRuleModel, goRuleModelArr } = this.params;
        let fromAirport = this.params.filterOptions.RtFromAirport?this.params.filterOptions.RtFromAirport:'不限'
        let toAirport = this.params.filterOptions.RtToAirport?this.params.filterOptions.RtToAirport:'不限'
        this.state = {
            /**
             * 是否加载
             */ 
            showLoading: true,
            /**
             * 行程类型：是否是往返
             */
            isRt,
            //去程的超标原因
            goRuleModel:goRuleModel,
            goRuleModelArr:goRuleModelArr,
            /**
             * 当前筛选项
             */
            curFilterTab: this.params.curFilterTab,

            /**
             *  查询最低价model
             */
            queryModel: queryModel,

            /**
             * 最低价列表
             */
            lowPriceList: [],
            /**
             *   
             */
            allPriceList: [],
            /**
             * 显示更多价格索引
             */
            showMoreIndex: -1,
            /**
             * 筛选列表
             */
            filterList: [],
            /**
             * 请求的参数（新接口）
             */
            newQueryModel: null,

            priceListCount: 15,

            isFromFilter: false,
            /**
             * 筛选项
             */
            filterOptions:
            {
                fromTime:this.params.filterOptions.fromTime?this.params.filterOptions.fromTime: '不限',
                toTime:this.params.filterOptions.toTime?this.params.filterOptions.toTime: '不限',
                fromAirport:fromAirport?fromAirport: '不限',
                toAirport:toAirport?toAirport: '不限',
                transformCity: ['不限'],
                cabin:this.params.filterOptions.cabin?this.params.filterOptions.cabin: [queryModel.CabinModel.name],
                airCompany: ['不限'],
                airCompanyCode: ['不限'],
                flightType:this.params.filterOptions.flightType?this.params.filterOptions.flightType: "不限",
                isDirect:this.params.filterOptions.isDirect?this.params.filterOptions.isDirect: false,
            },
            showErrorMessage: '',

            directCount: 0,

            containTax: true,

            airPortData:[],//机场英文翻译

            craftTypeList:[],
        };
        // this._navigationHeaderView = {
        //     titleView: this._titleView()
        // }
    }
    // 头视图
    _titleView = () => {
        const { queryModel } = this.params;
        const { DestinationCity, DepartureCity } = queryModel;
        const { directCount, filterList } = this.state;
        return (
            <View style={{ justifyContent: "center", alignItems: "center" }}>
                <CustomText style={{ fontSize: 16, color: Theme.fontColor }} text={(Util.Parse.isChinese() ? queryModel.ArrCityName : (DestinationCity.CityEg ? DestinationCity.CityEg : DestinationCity.CityCode)) + '-' + (Util.Parse.isChinese() ? queryModel.DepCityName : (DepartureCity.CityEg ? DepartureCity.CityEg : DepartureCity.CityCode))} />
                {
                    filterList.length > 0 || directCount > 0 ?
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {filterList.length > 0 ? <CustomText style={{ color: "gray" ,fontSize: 12}} text={filterList.length +  I18nUtil.translate('航班')} /> : null}
                            {directCount > 0 ? <CustomText style={{ color: "gray" ,fontSize: 12 }} text={'，' + directCount + I18nUtil.translate('直飞')} /> : null}
                        </View> :
                    null
                }
            </View>
        )
    }

    componentDidMount() {
        const { journey, allPriceList } = this.params;  
        const { filterOptions } = this.state;  
        let DepArrPairs = [];
        if (this.state.isRt) {
            DepArrPairs.push({ DepAirport: this.state.queryModel.OriCode, ArrAirport: this.state.queryModel.DesCode, DepDate: this.state.queryModel.DepDate });
            DepArrPairs.push({ DepAirport: this.state.queryModel.DesCode, ArrAirport: this.state.queryModel.OriCode, DepDate: this.state.queryModel.RetDate });
        } else {
            DepArrPairs.push({ DepAirport: this.state.queryModel.OriCode, ArrAirport: this.state.queryModel.DesCode, DepDate: this.state.queryModel.DepDate });
        }
        this.state.newQueryModel = {
            IsQueryAll: false,
            DepArrPairs: DepArrPairs,
            IsOnlyDirect: this.params.queryModel.isDirect,
            // PhysicalCabins: this.state.queryModel.PhysicalCabin ? [this.state.queryModel.PhysicalCabin] : []
            PhysicalCabins: this.state.queryModel.PhysicalCabin != null && 
                this.state.queryModel.PhysicalCabin !== '' && 
                (typeof this.state.queryModel.PhysicalCabin !== 'object' || 
                 (Array.isArray(this.state.queryModel.PhysicalCabin) && 
                  this.state.queryModel.PhysicalCabin.length > 0))
            ? [this.state.queryModel.PhysicalCabin] 
            : []
        }

        let priceArray = [];
        let priceArrayDirect = [];
        let RtFliterArr = []
        for (let i = 0; i < allPriceList.length; i++) {
            let obj = Util.Encryption.clone(allPriceList[i]);
                obj.OWFlights = obj.Journeys[1];
                if (obj.OWFlights.FlightSegments.length === 1) {
                    this.state.directCount++;
                }
                // if(obj.OWFlights.FlightSegments.length === 1){
                //     priceArrayDirect.push({
                //         ...obj,
                //         RTFlights: null
                //     });
                // }
                priceArray.push({
                    ...obj,
                    RTFlights: null
                });
                if(!(
                    (filterOptions.toAirport&&filterOptions.toAirport!='不限' && obj.OWFlights.ArrivalAirportName != filterOptions.toAirport) || 
                    (filterOptions.fromAirport&&filterOptions.fromAirport != '不限'&& obj.OWFlights.DepartureAirportName != filterOptions.fromAirport)
                    //注掉 去程航空公司筛选判断，返程分开筛选
                    // || (filterOptions.airCompanyCode&&filterOptions.airCompanyCode != '不限'&& obj.OWFlights.FlightSegments[0].Airline!= filterOptions.airCompanyCode)                    
                   ) 
                   &&
                   !(this.params.filterOptions.isDirect && obj.OWFlights.FlightSegments.length >1)
                ){
                    RtFliterArr.push({
                        ...obj,
                        RTFlights: null
                    });
                }
       }
        this.setState({
            allPriceList,
            // filterList:this.params.filterOptions.isDirect?priceArrayDirect: priceArray,
            // lowPriceList: this.params.filterOptions.isDirect?priceArrayDirect: priceArray,
            filterList:RtFliterArr,
            lowPriceList:RtFliterArr,
            selectedJourney: journey
        },()=>{
            this._navigationHeaderView = {
                titleView: this._titleView()
            }
           this.setState({});    
        })

        StorageUtil.loadKey(Key.CraftTypeList).then(result => {
            this.setState({
                craftTypeList: result || [],
            })
        })

        Util.Parse.isChinese() ? null : this._loadAirport();

    }

    _loadAirport(){
        this.showLoadingView();
        InflFlightService.GetCommonAirport2().then(response => {
            this.hideLoadingView();
            if (response) {
                this.setState({
                    airPortData: response.data,
                })
            } else {
                this.toastMsg(response.message || '获取数据失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || "获取数据异常");
        })
    }

    // 筛选
    _filterProcess = (type) => {
        const { filterOptions, newQueryModel } = this.state;
        if (type === tabs.filter) {
            if (this.refs._flatlist && this.state.filterList.length > 0) {
                this.refs._flatlist.scrollToIndex({ viewPosition: 0, index: 0 });
            }
            this.push('IntlFlightFilter', {
                options: filterOptions,
                queryModel: newQueryModel,
                list: this.state.lowPriceList,
                RtFilter:true,
                filter: (resultList,allDirectfilterList, options) => {
                    let isFilter = resultList.length === this.state.lowPriceList.length ? false : true;
                    this.setState({ 
                        filterList: resultList, 
                        curFilterTab: type, 
                        filterOptions: options,
                        priceListCount: resultList.length, 
                        isFromFilter: isFilter 
                    });

                }
            });
        } else {
            let list = this.state.filterList.slice();
            if (type === tabs.depTimeAsc) {
                list.sort((a, b) => {
                    if (a.OWFlights && b.OWFlights) {
                        if (!a.OWFlights['beginDate']) {
                            a.OWFlights.beginDate = Util.Date.toDate(a.OWFlights.FlightSegments[0].DepartureTime);
                        }
                        if (!b.OWFlights['beginDate']) {
                            b.OWFlights.beginDate = Util.Date.toDate(b.OWFlights.FlightSegments[0].DepartureTime);
                        }
                        return a.OWFlights['beginDate'] - b.OWFlights['beginDate'];
                    }
                    return 0;
                });
            } else if (type === tabs.runTimeAsc) {
                list.sort((a, b) => {
                    if (a.OWFlights && b.OWFlights && a.OWFlights['Duration'] && b.OWFlights['Duration']) {
                        let aTotal = a.OWFlights['Duration'].replace('h', '.');
                        let bTotal = b.OWFlights['Duration'].replace('h', '.');
                        let aTotal2 = aTotal.replace('m', '');
                        let bTotal2 = bTotal.replace('m', '');
                        return aTotal2 - bTotal2;
                    }
                    return 0;
                });
            } else if (type === tabs.priceAsc) {
                list.sort((a, b) => (a['TotalPrice'] - b['TotalPrice']));
            }
            this.setState({ filterList: list, curFilterTab: type });
        }
    }



    /* 更多价查询
     */
    _queryMorePrice = (item, index) => {
        let moreQueryModel = {};
        let moreQueryModel2 = {};
        const { queryModel , selectedJourney, isRt, newQueryModel,goRuleModel,goRuleModelArr,airPortData ,filterOptions} = this.state;
       
        let DepArrPairs = [];
        // if (this.state.isRt) {
        //     DepArrPairs.push({ DepAirport: this.state.queryModel.OriCode, ArrAirport: this.state.queryModel.DesCode, DepDate: this.state.queryModel.DepDate });
        //     DepArrPairs.push({ DepAirport: this.state.queryModel.DesCode, ArrAirport: this.state.queryModel.OriCode, DepDate: this.state.queryModel.RetDate });
        // } else {
        //     DepArrPairs.push({ DepAirport: this.state.queryModel.OriCode, ArrAirport: this.state.queryModel.DesCode, DepDate: this.state.queryModel.DepDate });
        // }
        item.Journeys.forEach((journey)=>{
            DepArrPairs.push({
                DepAirport:journey.DepartureAirport,
                ArrAirport:journey.ArrivalAirport,
                DepDate:journey.FlightSegments[0].DepartureTime,
            })
        })


        this.state.newQueryModel = {
            IsQueryAll: false,
            DepArrPairs: DepArrPairs,
            IsOnlyDirect: this.params.queryModel.isDirect,
            // PhysicalCabins: this.state.queryModel.PhysicalCabin ? [this.state.queryModel.PhysicalCabin] : null
            PhysicalCabins: this.state.queryModel.PhysicalCabin != null && 
                this.state.queryModel.PhysicalCabin !== '' && 
                (typeof this.state.queryModel.PhysicalCabin !== 'object' || 
                 (Array.isArray(this.state.queryModel.PhysicalCabin) && 
                  this.state.queryModel.PhysicalCabin.length > 0))
            ? [this.state.queryModel.PhysicalCabin] 
            : []
        }


        Object.assign(moreQueryModel, queryModel);
        moreQueryModel.AvailableJourneysJson = item.AvailableJourneysJson;
        Object.assign(moreQueryModel2,this.state.newQueryModel );
        moreQueryModel2.IsQueryAll = true
        moreQueryModel2.AvailableJourneysJson = item.AvailableJourneysJson;
        moreQueryModel2.DataId = item.DataId;
        IntlFlightEnum.cabins.map((_item)=>{
            if(_item.name == filterOptions.cabin[0] ){
                moreQueryModel2.PhysicalCabin = _item.code;
                moreQueryModel2.PhysicalCabins =_item.code? [_item.code]:[];
                moreQueryModel.CabinModel = _item;
                moreQueryModel.PhysicalCabin = _item.code;
            }
        })
        this.push('IntlFlightMorePriceList', {
            key: this.params.key,
            journey: item,
            queryModel: moreQueryModel,
            newQueryModel: moreQueryModel2,
            selectedJourney: selectedJourney,
            isRt: isRt,
            airPortData,
            goRuleModel:goRuleModel,
            goRuleModelArr:goRuleModelArr,
            JourneyId:this.params.JourneyId
        });
    }
    renderBody() {
        const { queryModel, filterList, isRt, showErrorMessage, curFilterTab, containTax } = this.state;
        let depDate = Util.Date.toDate(queryModel.DepDate);
        let retDate = Util.Date.toDate(queryModel.RetDate);
        return (
            <View style={{ flex: 1 }}>
                <View style={{ paddingHorizontal: 20, justifyContent: 'center',height:32,backgroundColor:Theme.greenBg }}>
                    <Text allowFontScaling={false} style={{ fontSize: 12, color:Theme.theme }}>{I18nUtil.translate('出发日期')}：{depDate && depDate.format('yyyy-MM-dd')} {isRt && queryModel.RetDate ? ' —— ' + I18nUtil.translate('返回日期') + '：' + (retDate && retDate.format('yyyy-MM-dd')) : ''}</Text>
                </View>
                {

                    filterList.length === 0 && (showErrorMessage || curFilterTab === tabs.filter) ?
                        this._renderError()
                        :
                        <FlatList
                            style={{ flex: 1 }}
                            ref='_flatlist'
                            data={filterList}
                            renderItem={this._renderListItem}
                            initialNumToRender={12}
                            showsVerticalScrollIndicator={false}
                            ListHeaderComponent={
                                <View style={{ height: 44, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row',paddingHorizontal:20 }}>
                                    <CustomText  text='航班起降时间均为当地时间'style={{width:200, }} />
                                    <TouchableOpacity onPress={() => this.setState({ containTax: !this.state.containTax })}>
                                    <View style={{flexDirection:'row'}}>
                                        <MaterialIcons
                                            name={containTax?'radio-button-checked': 'radio-button-unchecked'}
                                            size={20}
                                            color={Theme.theme}
                                        />
                                        <CustomText text={'含税'} style={{ color:containTax ? Theme.theme : Theme.commonFontColor }} />
                                    </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => this.setState({ containTax: !this.state.containTax })}>
                                    <View style={{flexDirection:'row'}}>
                                        <MaterialIcons
                                            name={!containTax?'radio-button-checked': 'radio-button-unchecked'}
                                            size={20}
                                            color={Theme.theme}
                                        />
                                         <CustomText text={'不含税'} style={{ color:!containTax ? Theme.theme : Theme.commonFontColor }} />
                                    </View>
                                    </TouchableOpacity>
                                </View>
                            }
                            keyExtractor={(item, index) => String(index)}
                        />
                }
                {this._renderFooter()}
            </View>
        )
    }
    _renderListItem = ({ item, index }) => {
        const { containTax,isFromFilter } = this.state;
        return (
            <TouchableOpacity style={{ marginHorizontal: 10,marginBottom:8,borderRadius:6,backgroundColor: '#fff',}} onPress={() => this._queryMorePrice(item, index)}>
                {
                    item.HasCompanyCode ?
                        <View style={{flexDirection:'row'}}>
                            <View style={curStyle.lowPrice2}>
                                <CustomText text={'协议'} style={{ backgroundColor: Theme.orangelableColor, borderRadius: 2, color: '#fff', fontSize: 11,paddingHorizontal:6 }}></CustomText>
                            </View>
                        </View>
                    : null
                } 
                <View style={{ paddingHorizontal:15,paddingVertical:10}}>
                  <View style={{flexDirection: 'row',justifyContent:"space-between",borderRadius:6,alignItems: 'flex-start',}}>
                        {isFromFilter ? item.RTFlights?this._renderFlight(item.RTFlights, true):this._renderFlight(item.OWFlights, true) : this._renderFlight(item.OWFlights, true)}
                        {/* {this._renderFlight(item.OWFlights, true)} */}
                        <View style={{  justifyContent: 'center', alignItems: 'flex-end' }}>
                            <Text style={{ color: Theme.theme, fontSize: 14,fontWeight:'bold' ,marginTop:2}}> 
                                ¥<Text allowFontScaling={false} style={{ color: Theme.specialColor2, fontSize: 19 }}>{item.BasePrice + (containTax ? item.Tax : 0)}</Text>
                            </Text>
                            <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 10 }}>{this.state.isRt ?  I18nUtil.translate('往返价') : ''}</Text>
                           
                            <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 10 }}>{containTax ? I18nUtil.translate('含税') : (I18nUtil.translate('税') + '¥' + item.Tax)}</Text>
                        </View>
                   </View>
                   {/* <View style={{alignItems:'flex-end',paddingBottom:5}}>
                        <CustomText style={{ fontSize: 12, color: Theme.theme, marginRight: 10 }} text={'CO₂ : '+item.Journeys[1].MaxCarbonEmission+"kg"} />
                   </View> */}
                </View>
            </TouchableOpacity>
        );
    }
    _renderFlight(journey, isFrom) {
        if (!journey) {
            return null;
        }
        const flights = journey.FlightSegments;
        journey.durationDesc = journey.Duration.replace(':', 'h');
        journey.beginDate = Util.Date.toDate(flights[0].DepartureTime);
        journey.endDate = Util.Date.toDate(flights[flights.length - 1].ArrivalTime);
        journey.diffDay = Util.Date.getDiffDay(journey.beginDate, journey.endDate);
        journey.airlineDesc = (Util.Parse.isChinese() ? (flights[0].AirlineName?flights[0].AirlineName:flights[0].Airline) : flights[0].Airline) + " " + flights[0].Airline + flights[0].FlightNumber;
        let shareDesc = '';
        flights.forEach(element => {
            if (element.ShareAirlineNumber && element.ShareAirlineName) {
                if (!shareDesc) {
                    // shareDesc = (Util.Parse.isChinese() ? element.AirlineName : '') + element.Airline + element.FlightNumber + (I18nUtil.translate('与')) + element.ShareAirlineCode + element.ShareAirlineNumber + I18nUtil.translate('共享') + ',' + I18nUtil.translate('实际由') + (Util.Parse.isChinese() ? element.ShareAirlineName : element.ShareAirlineCode) + I18nUtil.translate('承运');
                    shareDesc = element.Airline + element.FlightNumber + (I18nUtil.translate('与')) + element.ShareAirlineCode + element.ShareAirlineNumber + I18nUtil.translate('共享') + ',' + I18nUtil.translate('实际由') + (Util.Parse.isChinese() ? element.ShareAirlineName : element.ShareAirlineCode) + I18nUtil.translate('承运');

                } else {
                    shareDesc = element.Airline + element.FlightNumber + (I18nUtil.translate('与')) + element.ShareAirlineCode + element.ShareAirlineNumber + I18nUtil.translate('共享') + ',' + I18nUtil.translate('实际由') + (Util.Parse.isChinese() ? element.ShareAirlineName : element.ShareAirlineCode) + I18nUtil.translate('承运');
                    // shareDesc = shareDesc + (Util.Parse.isChinese() ? element.AirlineName : '') + element.Airline + element.FlightNumber + (I18nUtil.translate('与')) + element.ShareAirlineCode + element.ShareAirlineNumber + I18nUtil.translate('共享') + ',' + I18nUtil.translate('实际由') + (Util.Parse.isChinese() ? element.ShareAirlineName : element.ShareAirlineCode) + I18nUtil.translate('承运');
                }
            }
        });

        const { airPortData,craftTypeList } = this.state;
        let DepartureCityEnName = ''
        let ArrivalAirport = ''
        let ArrivalCityEn = ''
        let DepartureAirportEn = ''
        if(flights.length > 0){
            airPortData.map((item)=>{
                if(item.AirportCode == flights[0]['DepartureAirport']){
                    DepartureCityEnName = item.CityEnName
                    DepartureAirportEn = item.AirportEnName
                    
                }
                if(item.AirportCode ==flights[flights.length - 1]['ArrivalAirport']){
                    ArrivalCityEn = item.CityEnName
                    ArrivalAirport = item.AirportEnName
                }
            })
        }
        let planType = Util.Read.planType(flights[0].Equipment, craftTypeList);
        return (
            <View style={{ }}>
                <View style={{ flexDirection: 'row',justifyContent: 'space-between', alignItems: 'center'}}>
                    <View style={{ justifyContent: 'flex-start',width:90,marginRight:-10}}>
                        <CustomText style={{ fontSize: 20, fontWeight: 'bold' }} text={journey.beginDate.format('HH:mm')} />
                        <CustomText style={{ color: Theme.commonFontColor, fontSize: 12,marginTop:5 }} text={(Util.Parse.isChinese() ? flights[0].DepartureAirportName : DepartureAirportEn) + flights[0].DepartureTerminal} />
                    </View>
                    <View style={{justifyContent: 'center',alignItems: 'center'}}>
                        <CustomText style={{ color: Theme.aidFontColor, fontSize: 10 }} text={journey.durationDesc} />
                        {
                            flights.length > 1 ? 
                                <View style={{ alignItems: 'center' }}>
                                    <Image style={{ height: 10, width: 60 }} source={Util.Parse.isChinese()? require('../../res/Uimage/flightFloder/zhongzhuan.png'):require('../../res/Uimage/flightFloder/zhongzhuan_e.png')} />
                                    <CustomText style={{ fontSize: 10, color: Theme.orangeColor }} 
                                            text={Util.Parse.isChinese() ? flights[0]['ArrivalCityName'] : ArrivalCityEn}                                         
                                    />
                                    {/* <View style={{flexDirection:"row"}}>
                                        <CustomText style={{ fontSize: 10, borderColor: Theme.theme, color: Theme.theme, borderWidth: 0.5,height:12,width:10,textAlign:'center' }} text='转' />
                                        <CustomText style={{ fontSize: 10, color: Theme.theme }} 
                                            text={Util.Parse.isChinese() ? flights[0]['ArrivalCityName'] : ArrivalCityEn}                
                                        />
                                    </View> */}
                                </View>
                             : 
                            (
                                <Image style={{ height: 3, width: 60 }} source={require('../../res/Uimage/arrow.png')} />
                            )
                        }
                        <CustomText style={{ color: Theme.aidFontColor, fontSize: 10 }} text={''} />
                    </View>
                    <View style={{justifyContent: 'flex-end',width:90,marginLeft:-10}}>
                            <View style={{ flexDirection: 'row',justifyContent: 'flex-end' }}>
                            <CustomText style={{ fontSize: 20, fontWeight: 'bold',textAlign:'right'}} text={journey.endDate.format('HH:mm')} />
                            {
                              flights[0].DepartureDate != flights[flights.length - 1] && journey.diffDay > 0 ?
                                    <CustomText style={{ marginRight: -11, fontSize: 12, marginLeft: 3 }} text={'+' + journey.diffDay + (Util.Parse.isChinese() ? '天' : 'day')} />
                                    : null
                            }
                            </View>
                            <CustomText style={{ fontSize: 12, marginTop: 2,textAlign:'right',color: Theme.commonFontColor, }} text={(Util.Parse.isChinese() ? flights[flights.length - 1].ArrivalAirportName : ArrivalAirport) + flights[flights.length - 1].ArrivalTerminal} />
                    </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12,width:240 }}>
                    {/* {
                        isFrom ? (
                            <View style={{ backgroundColor: Theme.theme, paddingHorizontal: 1, borderRadius:2 ,marginRight: 4}}>
                                <CustomText style={{ fontSize: 11, color: 'white' }} text='回程' />
                            </View>
                        ) : (
                                <View style={{ backgroundColor: Theme.specialColor2, paddingHorizontal: 1, borderRadius:2,marginRight: 4 }}>
                                    <CustomText style={{ fontSize: 11, color: 'white' }} text='回程' />
                                </View>
                            )
                    } */}
                    {shareDesc ? <CustomText style={{ marginRight: 4, color: Theme.theme, fontSize: 12 }} text='共享' onPress={() => { this.showAlertView(shareDesc) }} /> : null}
                    <CropImage code={flights[0].Airline}></CropImage>
                    <CustomText style={{ marginRight: 4, color: Theme.aidFontColor, fontSize: 12 }} text={journey.airlineDesc} />
                    <CustomText style={{ color: Theme.assistFontColor }} text={'|'} />
                    {flights[0].Equipment&&<CustomText style={{ marginLeft: 5, color: Theme.aidFontColor, fontSize: 12 }} text={planType} />} 
                    <CustomText style={{ color: Theme.assistFontColor }} text={'| '} />
                    <CustomText style={{ marginRight: 5, color: Theme.assistFontColor, fontSize: 12 }}  text={(flights[0].MealDesc ? I18nUtil.translate(flights[0].MealDesc) : '')}></CustomText> 
                    {
                        this.props.highRisk2 && this.props.highRisk2.Level >=1 && 
                        <View style={{flexDirection:"row",justifyContent:"flex-end"}}>
                            <Foundation name={'info'} style={{ marginRight: 5 }} size={20} color={this.props.highRisk2.Level == 1 ? Theme.theme : this.props.highRisk2.Level == 2 ? Theme.redColor : null} />
                        </View>
                    } 
                </View>
                <Text allowFontScaling={false} style={{  color: Theme.theme, fontSize: 12,marginTop:5,backgroundColor:Theme.greenBg,width:80,textAlign: 'center',paddingVertical:2,borderRadius:2  }}>
                    {journey.beginDate && journey.beginDate.format('yyyy-MM-dd')}
                </Text>
                {/* <View style={{ flexDirection: 'row', alignItems: 'center',justifyContent:"space-between",marginTop:5 }}>
                    {
                        this.props.highRisk2 && this.props.highRisk2.Level >=1 && 
                        <View style={{flexDirection:"row",justifyContent:"flex-end"}}>
                            <Foundation name={'info'} style={{ marginRight: 5 }} size={20} color={this.props.highRisk2.Level == 1 ? Theme.theme : this.props.highRisk2.Level == 2 ? Theme.redColor : null} />
                        </View>
                    }
                </View> */}

            </View>
        );
    }
    _renderError = () => {
        const { showErrorMessage } = this.state;
        return (
            <View style={{ flex: 1 }}>
                {
                    showErrorMessage === '网络超时，请检查您的网络' || showErrorMessage === 'Network request failed' ?
                        <NetworkFaildView refresh={() => {
                            this.setState({
                                showErrorMessage: '',
                                showLoading: true,
                                filterList: [],
                                lowPriceList: [],
                            }, () => {
                                this._queryLowPrice();
                            })
                        }} /> :
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                            <CustomText style={{ color: 'gray' }} text={showErrorMessage || '没有符合条件的航班了'} />
                        </View>
                }
            </View>
        )
    }
    /**
     * 渲染底部
     */
    _renderFooter = () => {
        const { curFilterTab } = this.state;
        return (
            <View style={{ height: 50, flexDirection: 'row', marginTop: 3, backgroundColor: 'white',borderTopWidth:2,borderColor:Theme.greenBg }}>
                <TouchableOpacity style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} onPress={() => this._filterProcess(tabs.depTimeAsc)}>
                    <Image style={[curStyle.tabIcon, curFilterTab === tabs.depTimeAsc ? curStyle.activeTab : null]} source={require('../../res/Uimage/IntFlightFloder/_timeb.png')} />
                    <CustomText style={[curStyle.tabFont2, curFilterTab === tabs.depTimeAsc ? { color: Theme.theme } : null]} text='出发最早' />
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} onPress={() => this._filterProcess(tabs.priceAsc)}>
                    <Image style={[curStyle.tabIcon, curFilterTab === tabs.priceAsc ? curStyle.activeTab : null]} source={require('../../res/Uimage/flightFloder/_yuan.png')} />
                    <CustomText style={[curStyle.tabFont, curFilterTab === tabs.priceAsc ? { color: Theme.theme } : null]} text='价格排序' />
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} onPress={() => this._filterProcess(tabs.runTimeAsc)}>
                    <Image style={[curStyle.tabIcon, curFilterTab === tabs.runTimeAsc ? curStyle.activeTab : null]} source={require('../../res/Uimage/flightFloder/time_circle2.png')} />
                    <CustomText style={[curStyle.tabFont, curFilterTab === tabs.runTimeAsc ? { color: Theme.theme } : null]} text='耗时最短' />
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} onPress={() => this._filterProcess(tabs.filter)}>
                    <Image style={[curStyle.tabIcon, curFilterTab === tabs.filter ? curStyle.activeTab : null]} source={require('../../res/Uimage/flightFloder/filter.png')} />
                    <CustomText style={[curStyle.tabFont, curFilterTab === tabs.filter ? { color: Theme.theme } : null]} text='筛选' />
                </TouchableOpacity>
            </View>
        );
    }
}

const getStatePorps = state => ({
    highRisk2:state.highRisk2.highRisk2,
})
const getActions = dispatch => ({
    setApply: (value) => dispatch(Action.applySet(value)),
})
export default connect(getStatePorps,getActions)(IntlFlightRtListScreen);

const curStyle = StyleSheet.create({


    borderTop: {
        borderTopColor: 'gray',
        borderTopWidth: 1
    },
    tabFont: {
        color: '#999',
        fontSize: 12,
        marginTop: 5,
        
    },
    tabFont2: {
        color: '#999',
        fontSize: 12,
        marginTop: 5,
        marginRight:-14
        
    },
    activeFont: {
        color: Theme.theme
    },
    activeTab: {
        tintColor: Theme.theme
    },
    tabIcon: {
        height: 20,
        width: 20,
        // tintColor: '#999'
    },
    lowPrice2: {
        backgroundColor: Theme.orangeBg,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderTopLeftRadius: 6,
        borderBottomRightRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection:'row'
    },
});
/**
 * 选项卡
 */
const tabs = {
    /**
     * 从早到晚
     */
    depTimeAsc: 1,
    priceAsc: 2,
    runTimeAsc: 3,
    /**
     * 筛选
     */
    filter: 4
}