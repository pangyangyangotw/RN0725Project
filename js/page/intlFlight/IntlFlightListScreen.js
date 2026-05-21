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
import UserInfoDao from '../../service/UserInfoDao';
import TitleSwitchView from '../common/TitleSwitchView';
import Util from '../../util/Util';
import I18nUtil from '../../util/I18nUtil';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import InflFlightService from '../../service/InflFlightService';
import NetworkFaildView from '../../custom/NetWorkFaildView';
import Foundation from 'react-native-vector-icons/Foundation';
import AntDesign from 'react-native-vector-icons/AntDesign'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import ViewUtil from '../../util/ViewUtil';
import { connect } from 'react-redux';
import Action from '../../redux/action/index';
import IntlFlightEnum from "../../enum/IntlFlightEnum";
import CropImage from '../../custom/CropImage';
import Key from '../../res/styles/Key';
import StorageUtil from '../../util/StorageUtil';
class IntlFlightListScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};


        this._tabBarBottomView = {
            bottomInset: true,
            bottomColor: 'white'
        }
        const { queryModel, isRt } = this.params;
        this.state = {
            /**
             * 是否加载
             */
            showLoading: true,
            /**
             * 行程类型：是否是往返
             */
            isRt,
            /**
             * 当前筛选项
             */
            curFilterTab: null,

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
            filterOptions: {
                fromTime: '不限',
                toTime: '不限',
                fromAirport: '不限',
                toAirport: '不限',
                transformCity: ['不限'],
                cabin: [queryModel.CabinModel.name],
                airCompany: ['不限'],
                airCompanyCode: ['不限'],
                flightType: "不限",
                isDirect: queryModel.isDirect,
                isShare: true,
            },
            showErrorMessage: '',

            directCount: 0,

            containTax: true,

            airPortData:[],//机场英文翻译

            allDirectfilterList:[],
            isDirect:queryModel.isDirect,
            craftTypeList:[],

        };
        this._navigationHeaderView = {
            // hide:true,
            titleView: this._titleView()
        }
    }
    // 头视图
    _titleView = () => {
        const { queryModel } = this.params;
        const { DestinationCity, DepartureCity } = queryModel;
        const { directCount, filterList } = this.state;
        return (
            <View style={{ justifyContent: "center", alignItems: "center" }}>
                <CustomText style={{ fontSize: 16, color: Theme.fontColor }} text={(Util.Parse.isChinese() ? queryModel.DepCityName : (DepartureCity.CityEg ? DepartureCity.CityEg : DepartureCity.CityCode)) + '-' + (Util.Parse.isChinese() ? queryModel.ArrCityName : (DestinationCity.CityEg ? DestinationCity.CityEg : DestinationCity.CityCode))} />
                {
                    filterList.length > 0 || directCount > 0 ?
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {filterList.length > 0 ? <CustomText style={{ color: Theme.darkColor }} text={I18nUtil.tranlateInsert('{{noun}}航班',filterList.length)} /> : null}
                            {directCount > 0 ? <CustomText style={{ color: Theme.darkColor }} text={'，' + directCount + I18nUtil.translate('直飞')} /> : null}
                        </View> :
                        null
                }
            </View>
        )
    }

    componentDidMount() {
        this._queryLowPrice();
        StorageUtil.loadKey(Key.CraftTypeList).then(result => {
            this.setState({
                craftTypeList: result || [],
            })
        })  
    }

    _loadAirport(){
        // this.showLoadingView();
        const { getAirPortEnName } = this.props;
        InflFlightService.GetCommonAirport2().then(response => {
            // this.hideLoadingView();
            if (response) {
                this.setState({
                    airPortData: response.data,
                })
                getAirPortEnName(response.data);
            } else {
                this.toastMsg(response.message || '获取数据失败');
            }
        }).catch(error => {
            // this.hideLoadingView();
            this.toastMsg(error.message || "获取数据异常");
        })
    }
    // 查询最低价
    _queryLowPrice = () => {
        this.showLoadingView();
        let DepArrPairs = [];
        if (this.state.isRt) {
            DepArrPairs.push({ DepAirport: this.state.queryModel.OriCode, ArrAirport: this.state.queryModel.DesCode, DepDate: this.state.queryModel.DepDate });
            DepArrPairs.push({ DepAirport: this.state.queryModel.DesCode, ArrAirport: this.state.queryModel.OriCode, DepDate: this.state.queryModel.RetDate });
        } else {
            DepArrPairs.push({ DepAirport: this.state.queryModel.OriCode, ArrAirport: this.state.queryModel.DesCode, DepDate: this.state.queryModel.DepDate });
        }
        const { apply } = this.props;
        let journeyid = 0;
        if(apply){
            if(apply.TravelApplyMode==1 && apply.JourneyList && apply.JourneyList.length>0){
                //行程模式
                if(apply.selectApplyItem){
                    journeyid = apply.selectApplyItem&&apply.selectApplyItem.Id
                }else{
                    apply.JourneyList.forEach((item,index)=>{
                        if(item?.BusinessCategory & 1){
                           journeyid = item.Id
                        }
                    })
                }
            }else{
                //目的地模式
                journeyid = apply.Id
            }
        }
        const { comp_userInfo } = this.props;
        let Travellers = comp_userInfo?.employees.concat(comp_userInfo?.travellers);
        let PassengerTypeQuantitys = [{ Code: 'ADT', Quantity:Travellers.length }]
        this.state.newQueryModel = {
            IsQueryAll: false,
            DepArrPairs: DepArrPairs,
            PhysicalCabins: this.state.queryModel.PhysicalCabin ? [this.state.queryModel.PhysicalCabin] : null,
            IsOnlyDirect:this.state.isDirect,
            Airlines:this.params.airline,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
            JourneyId:journeyid,
            ApplyId: apply?.Id || 0,
            PassengerTypeQuantitys:PassengerTypeQuantitys
        }
        InflFlightService.getIntlFlightQuery(this.state.newQueryModel).then(response => {
            this.hideLoadingView();
            if (response && Array.isArray(response)) {
                if (response.length === 0) {
                    this.setState({
                        showErrorMessage: '没有符合条件的航班啦~'
                    })
                    return;
                }
                let priceArray = [];
                for (let i = 0; i < response.length; i++) {
                    let journey = Util.Encryption.clone(response[i]);

                    // let index = priceArray.findIndex(obj => obj.Id === journey.Id && obj.TotalPrice < journey.TotalPrice);
                    let index = priceArray.findIndex(obj => obj.Id === journey.Id);
                    if (index === -1) {
                        journey.OWFlights = journey.Journeys[0];
                        if (journey.OWFlights.FlightSegments.length === 1) {
                            this.state.directCount++;
                        }
                        priceArray.push({
                            ...journey,
                            RTFlights: null
                        });
                    }
                }

                this.setState({ 
                    showLoading: false, 
                    filterList: priceArray, 
                    lowPriceList: priceArray, 
                    allPriceList: response 
                }, () => {
                    this._navigationHeaderView = {
                        titleView: this._titleView()
                    }
                    Util.Parse.isChinese() ?null : 
                    this._loadAirport();
                    this.setState({});
                });
            } else {
                this.setState({ showLoading: false, showErrorMessage: response.message });
            }
        }).catch(error => {
            this.hideLoadingView();
            this.setState({ showLoading: false, showErrorMessage: error.message });
            this.toastMsg(error.message || '获取航班列表失败');
        })


    }
    // 筛选
    _filterProcess = (type) => {
        const { filterOptions, newQueryModel } = this.state;
        const {canbinOption} = this.params || {}
        if (type === tabs.filter) {
            if (this.refs._flatlist && this.state.filterList.length > 0) {
                this.refs._flatlist.scrollToIndex({ viewPosition: 0, index: 0 });
            }
            this.push('IntlFlightFilter', {
                showDirect:this.state.directCount > 0,
                options: filterOptions,
                queryModel: newQueryModel,
                list: this.state.lowPriceList,
                canbinOption:canbinOption,
                filter: (resultList,allDirectfilterList, options) => {
                    const isFilter = resultList.length !== this.state.lowPriceList.length || options.isDirect;
                    const directCount = resultList.filter(item => 
                        item?.OWFlights?.FlightSegments?.length === 1
                    ).length;//计算直飞数量
                    let _allDirectfilterList = allDirectfilterList&& allDirectfilterList.length > 0 ? [...allDirectfilterList] : null
                    this.setState({ 
                        filterList: [...resultList], 
                        allDirectfilterList: _allDirectfilterList,
                        // allPriceList: resultList || this.state.allPriceList,
                        allPriceList:_allDirectfilterList || this.state.allPriceList,//筛选勾选直飞用重新获取的直飞数据，没有用原来的数据
                        curFilterTab: type, 
                        filterOptions: {...options}, 
                        priceListCount: resultList.length, 
                        isFromFilter: isFilter,
                        isDirect:options.isDirect,
                        directCount:directCount,
                        lowPriceList: resultList
                    },()=>{
                        this._navigationHeaderView = {
                            titleView: this._titleView()
                        }
                        this.forceUpdate();//刷新界面
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
                        let atime = a.OWFlights['Duration'].split('h')
                        let h_atime = atime[0]
                        let m_atime = atime[1].split('m')[0]
                        let aTotal = parseInt(h_atime) * 60 +parseInt(m_atime)

                        let btime = b.OWFlights['Duration'].split('h')
                        let h_btime = btime[0]
                        let m_btime = btime[1].split('m')[0]
                        let bTotal = parseInt(h_btime) * 60 +parseInt(m_btime)
                        
                        return aTotal - bTotal;
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
        const { queryModel, rtQueryModel, allPriceList, selectedJourney, isRt, isCustomerTab, newQueryModel, newRtQueryModel,airPortData,filterList,allDirectfilterList,filterOptions,curFilterTab } = this.state;
        const { comp_userInfo } = this.props;
        let Travellers = comp_userInfo?.employees.concat(comp_userInfo?.travellers);
        let PassengerTypeQuantitys = [{ Code: 'ADT', Quantity:Travellers.length }]
        IntlFlightEnum.cabins.map((_item)=>{
            if(_item.name === filterOptions.cabin[0]){
                this.params.queryModel.PhysicalCabin = _item.code;
                this.params.queryModel.CabinModel = _item;
            }
        })
        if (isRt && !selectedJourney) {
            this.params.queryModel.isDirect = this.state.isDirect;
            this.push('IntlFlightFlights', {
                journey: item,
                ...this.params,
                allPriceList,
                airPortData,
                allDirectfilterList,
                filterList,
                filterOptions,
                curFilterTab,
                JourneyId:this.params.JourneyId,
            });
            return;
        }
        Object.assign(moreQueryModel, queryModel);
        moreQueryModel.AvailableJourneysJson = item.AvailableJourneysJson;
        moreQueryModel.IsOnlyDirect = this.state.isDirect
        Object.assign(moreQueryModel2, newQueryModel);
        let DepArrPairs = [];
        item.Journeys.forEach((journey)=>{
            DepArrPairs.push({
                DepAirport:journey.DepartureAirport,
                ArrAirport:journey.ArrivalAirport,
                DepDate:journey.FlightSegments[0].DepartureTime,
            })
        })
        moreQueryModel2.AvailableJourneysJson = item.AvailableJourneysJson;
        moreQueryModel2.IsQueryAll = true;
        moreQueryModel2.IsOnlyDirect = this.state.isDirect
        moreQueryModel2.DepArrPairs = DepArrPairs
        moreQueryModel2.DataId = item.DataId;
        moreQueryModel2.PassengerTypeQuantitys = PassengerTypeQuantitys;
        this.push('IntlFlightMorePriceList', {
            key: this.params.key,
            journey: item,
            queryModel: moreQueryModel,
            newQueryModel: moreQueryModel2,
            selectedJourney: selectedJourney,
            isRt: isRt,
            isCustomerTab: isCustomerTab,
            airPortData,
            JourneyId:this.params.JourneyId,
            select: (journey) => {
                if (journey) {
                    this.setState({ selectedJourney: journey }, this._queryRtLowPrice);
                }
            }
        });
    }
    LeftClicked(){
        this.pop();
    }
    renderBody() {
        const { queryModel, filterList, isRt, showErrorMessage, curFilterTab, containTax} = this.state;
        let depDate = Util.Date.toDate(queryModel.DepDate);
        let retDate = Util.Date.toDate(queryModel.RetDate);
        const { DestinationCity, DepartureCity } = queryModel;
        const { directCount,  } = this.state;
        return (
            <View style={{ flex: 1 }}>
                {

                    filterList.length === 0 && (showErrorMessage || curFilterTab === tabs.filter) ?
                        this._renderError()
                        :
                        <FlatList
                            style={{ flex: 1 }}
                            ref='_flatlist'
                            data={filterList}
                            renderItem={this._renderListItem}
                            showsVerticalScrollIndicator={false}
                            initialNumToRender={12}
                            ListHeaderComponent={
                                <View style={{ height: 44, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row',paddingHorizontal:20 }}>
                                    <CustomText  text='航班起降时间均为当地时间' style={{width:200, }}/>
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
                            keyExtractor={(item, index) => `flight-${item.id || index}`}
                            removeClippedSubviews={true}
                            maxToRenderPerBatch={10}
                            updateCellsBatchingPeriod={50}
                            windowSize={21}
                        />
                }
                {this._renderFooter()}
            </View>
        )
    }
    _renderListItem = ({ item, index }) => {
        const { containTax,craftTypeList } = this.state;
        const flights = item.OWFlights.FlightSegments;
        let shareDesc = '';
        // let craftTypeList = [];
        // StorageUtil.loadKey(Key.CraftTypeList).then(result => {
        //     console.log('result---',result)
        //     craftTypeList = result || [];
        // })
        let planType = Util.Read.planType(flights[0].Equipment, craftTypeList);
        flights.forEach(element => {
            if (element.ShareAirlineNumber && element.ShareAirlineName) {
                if (!shareDesc) {
                    shareDesc = (Util.Parse.isChinese() ? element.AirlineName : '') + element.Airline + element.FlightNumber + (I18nUtil.translate('与')) + element.ShareAirlineCode + element.ShareAirlineNumber + I18nUtil.translate('共享') + ',' + I18nUtil.translate('实际由') + (Util.Parse.isChinese() ? element.ShareAirlineName : element.ShareAirlineCode) + I18nUtil.translate('承运');
                } else {
                    shareDesc = shareDesc + (Util.Parse.isChinese() ? element.AirlineName : '') + element.Airline + element.FlightNumber + (I18nUtil.translate('与')) + element.ShareAirlineCode + element.ShareAirlineNumber + I18nUtil.translate('共享') + ',' + I18nUtil.translate('实际由') + (Util.Parse.isChinese() ? element.ShareAirlineName : element.ShareAirlineCode) + I18nUtil.translate('承运');
                }
            }
        });
        return (
            <TouchableOpacity style={{ marginHorizontal: 10,marginBottom:8,borderRadius:6,backgroundColor: '#fff' }} onPress={() => this._queryMorePrice(item, index)}>
                {
                    item.HasCompanyCode ?
                        <View style={{flexDirection:'row'}}>
                            <View style={curStyle.lowPrice2}>
                                <CustomText text={'协议'} style={{ backgroundColor: Theme.orangelableColor, borderRadius: 2, color: '#fff', fontSize: 11,paddingHorizontal:6 }}></CustomText>
                            </View>
                        </View>
                    : null
                } 
                <View style={{padding:15,borderRadius:6}}>
                    <View style={{flexDirection: 'row',justifyContent:"space-between",borderRadius:6}}> 
                        {this._renderFlight(item.OWFlights)}
                        <View style={{  justifyContent: 'center', alignItems: 'flex-end' }}>
                            {/* <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 10,width:80 }}>{this.state.isRt ? I18nUtil.translate( '往返价') : ''}</Text> */}
                            <Text allowFontScaling={false} style={{ color: Theme.assistFontColor, fontSize: 10 }}>{this.state.isRt ? I18nUtil.translate( '往返价') : ''}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                                <Text allowFontScaling={false} style={{ color: Theme.theme, fontSize: 14 }}>¥</Text>
                                <Text allowFontScaling={false} style={{ color: Theme.theme, fontSize: 20 }}>{item.BasePrice + (containTax ? item.Tax : 0)}</Text>
                            </View>
                            <Text allowFontScaling={false} style={{ color: Theme.assistFontColor, fontSize: 10 }}>{containTax ? I18nUtil.translate('含税') : (I18nUtil.translate('税') + '¥' + item.Tax)}</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center',justifyContent:"space-between" }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {shareDesc ? <CustomText style={{ color: Theme.theme, fontSize: 12,marginRight: 5 }} text='共享' onPress={() => { this.showAlertView(shareDesc) }} /> : null}
                            <CropImage code={item.OWFlights.FlightSegments[0].Airline} ></CropImage>   
                            <CustomText style={{ marginRight: 5, color: Theme.assistFontColor, fontSize: 12 }} text={item.OWFlights.airlineDesc} />
                            <CustomText style={{ color: Theme.assistFontColor }} text={'|'} />
                            <CustomText style={{ marginRight: 5, color: Theme.assistFontColor, fontSize: 12 }} text={planType} />
                            <CustomText style={{ color: Theme.assistFontColor }} text={'| '} />
                            <CustomText style={{ marginRight: 5, color: Theme.assistFontColor, fontSize: 12 }}  text={(flights[0].MealDesc ? I18nUtil.translate(flights[0].MealDesc) : '')}></CustomText>
                        </View>
                        
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center',justifyContent:"space-between",marginTop:5 }}>
                        <Text allowFontScaling={false} style={{ marginRight: 5, color: Theme.theme, fontSize: 12,backgroundColor:Theme.greenBg,paddingHorizontal:6,borderRadius:2,paddingVertical:2 }}>{item.OWFlights.beginDate && item.OWFlights.beginDate.format('yyyy-MM-dd')}</Text>
                        {
                            this.props.highRisk && this.props.highRisk.Level >=1 && 
                            <View style={{flexDirection:"row",justifyContent:"flex-end"}}>
                                <Foundation name={'info'} style={{ marginRight: 5 }} size={20} color={this.props.highRisk.Level == 1 ? Theme.theme : this.props.highRisk.Level == 2 ? Theme.redColor : null} />
                            </View>
                        }
                    </View>
                </View>
            </TouchableOpacity>
        );
    }
    _renderFlight(journey) {
        if (!journey) {
            return null;
        }
        const flights = journey.FlightSegments;
        journey.durationDesc = journey.Duration.replace(':', 'h') ;
        journey.beginDate = Util.Date.toDate(flights[0].DepartureTime);
        journey.endDate = Util.Date.toDate(flights[flights.length - 1].ArrivalTime);
        journey.diffDay = Util.Date.getDiffDay(journey.beginDate, journey.endDate);
        journey.airlineDesc = (Util.Parse.isChinese() ? (flights[0].AirlineName?flights[0].AirlineName:flights[0].Airline) : '') + " " + flights[0].Airline + flights[0].FlightNumber;

        const { airPortData } = this.state;
        let ArrivalCityEnName = '';
        let DepartureAirport = '';
        let ArrivalAirport = ''
        if(flights.length > 0){
            airPortData&&airPortData.map((item)=>{
                if(item.AirportCode == flights[0]['DepartureAirport']){
                    // ArrivalCityEnName = item.CityEnName
                    DepartureAirport = item.AirportEnName
                }
                if(item.AirportCode == flights[0]['ArrivalAirport']){
                    ArrivalCityEnName = item.CityEnName
                }
                if(item.AirportCode == flights[flights.length - 1]['ArrivalAirport']){
                    ArrivalAirport = item.AirportEnName
                }
            })
        }
        return (
            <View>
                <View style={{ flexDirection: 'row',justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{justifyContent: 'flex-start',width:90,marginRight:-10}}>
                        <CustomText style={{ fontSize: 20, fontWeight: 'bold' }} text={journey.beginDate.format('HH:mm')} />
                        <CustomText style={{  fontSize: 12, marginTop: 2,textAlign:'left',color: Theme.commonFontColor}} text={(Util.Parse.isChinese() ? flights[0].DepartureAirportName : DepartureAirport) + flights[0].DepartureTerminal} />
                    </View>
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <CustomText style={{ marginLeft: 5, color: Theme.aidFontColor, fontSize: 10 }} text={journey.durationDesc} />
                        {
                            flights.length > 1 ? 
                                <View style={{ alignItems: 'center' }}>
                                    <Image style={{ height: 10, width: 60 }} source={Util.Parse.isChinese()? require('../../res/Uimage/flightFloder/zhongzhuan.png'):require('../../res/Uimage/flightFloder/zhongzhuan_e.png')} />
                                    <CustomText style={{ fontSize: 10, color: Theme.orangeColor }} 
                                            text={Util.Parse.isChinese() ? flights[0]['ArrivalCityName'] : ArrivalCityEnName}                                         
                                        />
                                    {/* <View style={{flexDirection:"row"}}>
                                        <CustomText style={{ fontSize: 10, borderColor: Theme.theme, color: Theme.theme, borderWidth: 0.5,height:12,width:10,textAlign:'center' }} text='转' />
                                        <CustomText style={{ fontSize: 10, color: Theme.theme }} 
                                            text={Util.Parse.isChinese() ? flights[0]['ArrivalCityName'] : ArrivalCityEnName}                                         
                                        />
                                    </View> */}
                                </View>
                             : 
                            (
                                <Image style={{ height: 3, width: 60 }} source={require('../../res/Uimage/arrow.png')} />
                            )
                        }
                        <CustomText text={''} style={{ fontSize: 10, color: Theme.aidFontColor }} />
                    </View>
                    <View style={{justifyContent: 'flex-end',width:90,marginLeft:-10}}>
                            <View style={{ flexDirection: 'row',justifyContent: 'flex-end' }}>
                            <CustomText style={{ fontSize: 20, fontWeight: 'bold',textAlign:'right'}} text={journey.endDate.format('HH:mm')} />
                            {
                              flights[0].DepartureDate != flights[flights.length - 1] && journey.diffDay > 0 ?
                                    <CustomText style={{ marginRight: -11, fontSize: 10, marginLeft: 3 }} text={'+' + journey.diffDay + (Util.Parse.isChinese() ? '天' : 'day')} />
                                    : null
                            }
                            </View>
                            <CustomText style={{ fontSize: 12, marginTop: 2,textAlign:'right',color: Theme.commonFontColor }} text={(Util.Parse.isChinese() ? flights[flights.length - 1].ArrivalAirportName : ArrivalAirport) + flights[flights.length - 1].ArrivalTerminal} />
                    </View>
                </View>
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
                <TouchableOpacity style={{flex:Util.Parse.isChinese()? 1:1.3,  justifyContent: 'center', alignItems: 'center' }} onPress={() => this._filterProcess(tabs.depTimeAsc)}>
                    <Image style={[curStyle.tabIcon, curFilterTab === tabs.depTimeAsc ? curStyle.activeTab : null]} source={require('../../res/Uimage/IntFlightFloder/_timeb.png')} />
                    <CustomText style={[curStyle.tabFont, curFilterTab === tabs.depTimeAsc ? { color: Theme.theme } : null]} text='出发最早' />
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
    highRisk:state.highRisk.highRisk,
    customerInfo_userInfo: state.customerInfo_userInfo,
    airportEnName:state.airportEnName,
    comp_userInfo: state.comp_userInfo,
    apply: state.apply.apply,

})
const getActions = dispatch => ({
    setApply: (value) => dispatch(Action.applySet(value)),
    getAirPortEnName: (value)=> dispatch(Action.getAirPortEnName(value)),
})
export default connect(getStatePorps,getActions)(IntlFlightListScreen);

const curStyle = StyleSheet.create({


    borderTop: {
        borderTopColor: 'gray',
        borderTopWidth: 1
    },
    tabFont: {
        color: '#999',
        fontSize: 12,
        marginTop: 5
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