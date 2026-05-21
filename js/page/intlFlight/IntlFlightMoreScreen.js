import React from 'react';
import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableHighlight,
    ActivityIndicator,
    FlatList,
    ScrollView,
    Image
} from 'react-native';
import SuperView from '../../super/SuperView';
import IntlFlightService from '../../service/InflFlightService';
import airlines from '../../res/js/airline';
import PolicyView from './PolicyView';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';
import Util from '../../util/Util';
import I18nUtil from '../../util/I18nUtil';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ViewUtil from '../../util/ViewUtil';
import HTMLView from 'react-native-htmlview';
import {connect} from 'react-redux';
import CropImage from '../../custom/CropImage';
import CommonService from '../../service/CommonService';
import Key from '../../res/styles/Key';
import StorageUtil from '../../util/StorageUtil';
class IntlFlightMoreScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        const { queryModel, selectedJourney, isRt, isCustomerTab, filterOptions,select, newQueryModel } = this.params;
        this.state = {
            queryModel: queryModel,
            newQueryModel: newQueryModel,
            filterOptions:filterOptions,
            isOnlyApply:false,
            alertShow:false,
            itemData:null,
            craftTypeList:[],
        }
        this._navigationHeaderView = {
             titleView: this._headerTitleView()
        }
    }
    /**
    *  标题
    */
    _headerTitleView = () => {
        const { journey } = this.params;
        if (journey && journey.OWFlights) {
            let flight = journey.OWFlights;
            return (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CustomText text={flight.DepartureCityName} style={curStyle.titleText} />
                    <CustomText text={'-'} style={curStyle.titleText} />
                    <CustomText text={flight.ArrivalCityName} style={curStyle.titleText} />
                </View>
            )
        }
        return null;
    }

    componentDidMount = () => {
        const{ customerInfo_userInfo,apply,compSwitch } = this.props;
        let model = {
                    ReferenceEmployeeId: this.props.comp_userInfo?.ReferenceEmployeeId || 0,
                    ReferencePassengerId: this.props.comp_userInfo?.referencPassengerId || null,
                };
        CommonService.customerInfo(model).then(response => {
            if (response?.success && response.data) {
                const isApply = response.data?.Setting?.FlightTravelApplyConfig;
                if (isApply && isApply.IsAllCategory && isApply.IsOnlyApply && !customerInfo_userInfo?.userInfo?.NoNeedApply && !apply) {
                    this.setState({ isOnlyApply: true });
                }
            }
        });
        StorageUtil.loadKey(Key.CraftTypeList).then(result => {
            this.setState({
                craftTypeList: result || [],
            })
        })
    }

    _btnReserve = (journey) => {
        const{ allDirectfilterList,filterList } = this.params;
        // if (this.props.highRisk && this.props.highRisk.Level ==1 && !journey.RTFlights) {
        //     this.showAlertView(this.props.highRisk.Message, () => {
        //         return ViewUtil.getAlertButton('确定', () => {
        //             this.dismissAlertView();
        //             if (this.props.highRisk.Level == 1) {
        //                     this._getTravelRule(journey);
        //             }
        //         })
        //     });
        //     return;
        // }
        if (this.props.highRisk && this.props.highRisk.Level ==1 && !journey.RTFlights) {
            this.setState({
                alertShow:true,
                itemData:journey,
            })
            return;
        } 
        if(this.props.highRisk && this.props.highRisk.Level == 2){
            this.toastMsg('高危区域，不能预订');
            return;
        } 
        this._toBackList(journey);
    }

    _toBackList = (journey) => {
        let flightList = [];
        this.params.allPriceList.forEach(flight => {
            let journey1 = flight.Journeys && flight.Journeys[0];
            if(journey1){
                flight.Id = '';
                journey1.FlightSegments.forEach(segment => {
                    // flight.Id += segment.DepartureAirport + '_' + segment.ArrivalAirport + '_' + segment.Airline + '_' + segment.FlightNumber + '_' + segment.DepartureTime + '_' + segment.ArrivalTime;
                    flight.Id += segment.DepartureAirport + '_' + segment.ArrivalAirport + '_' + segment.Airline + '_' + segment.FlightNumber + '_' + segment.DepartureTime;
                })
                if(flight.Id === journey.Id){
                    flightList.push(flight);
                }
            }
        })
        if(flightList&&flightList.length>0){
            this.params.allPriceList = flightList
        }
        this.push('IntlFlightRtListScreen', { ...this.params });
    }

    _getTravelRule = (journey) => {
        const { queryModel } = this.state;
        let params = Util.Encryption.clone(this.params);
        let model = {
            IntlFlightInfo:journey,
            RulesTravelId:queryModel.RulesTravelId,
            DepartureTime:journey.Journeys[0].FlightSegments[0].DepartureTime,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
            IsOnlyDirect:params.filterOptions&&params.filterOptions.isDirect
        }
        this.showLoadingView('差旅规则检查');
        IntlFlightService.MatchTravelRules(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if (response.data.unmatchlist && Array.isArray(response.data.unmatchlist) && response.data.unmatchlist.length > 0) {
                    
                    for (const obj of response.data.unmatchlist) {
                        if (obj.IsEnable && obj.RuleType === 1 && obj.LowPriceFights?.length > 0) {
                            params.MatchTravelRules = response.data;
                            params.LowPriceFights = obj.LowPriceFights;
                            // this.refs.lowPriceBottomView.showView(params);
                            // return;
                            this.push('IntFlightRuleScreen', params);
                            break;
                        }
                    }
                    for (const obj of response.data.unmatchlist) {
                        if (obj.IsEnable && obj.Advanceday && obj.RuleType === 2) {
                            params.MatchTravelRules = response.data;
                            this.push('IntFlightRuleScreen', params);
                            break;
                        }
                        if (obj.IsEnable && obj.Discount && obj.RuleType === 7) {
                            params.MatchTravelRules = response.data;
                            this.push('IntFlightRuleScreen', params);
                            break;
                        }
                    }
                }else{
                    this.push('IntlFlightRtListScreen', { ...this.params });
                }
            }else{
                this.toastMsg(response.message || '差旅规则检测失败')
            }        
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '差旅规则检测失败')
        })
    }

    renderBody() {
        const { journey } = this.params;
        const { isOnlyApply } = this.state;
        return (
            <View>
                {this._renderJourney(journey.OWFlights, true)}
                <View style={{ backgroundColor: 'white', marginTop: 10, padding: 10, flexDirection: 'row', justifyContent: 'space-between',marginHorizontal:10,borderRadius:6 }}>
                    <View>
                        <CustomText text={journey.TotalPrice} style={{ color: Theme.theme,fontSize:14 }} />
                        <CustomText text='含税' style={{ color: Theme.aidFontColor }} />
                    </View>
                    {isOnlyApply?
                        <TouchableHighlight style={{ backgroundColor: 'gray', justifyContent: 'center', alignItems: 'center', height: 32, width: 70, borderRadius: 2 }} 
                                            onPress={() => {
                                                this.toastMsg("请选择申请单预订");
                                            }} 
                        >
                            <CustomText style={{ color: 'white' }} text='选订' />
                        </TouchableHighlight>
                        :
                        <TouchableHighlight style={{ backgroundColor: Theme.theme, justifyContent: 'center', alignItems: 'center', height: 32, width: 70, borderRadius: 2 }} 
                                            onPress={() => this._btnReserve(journey)} 
                                            underlayColor={Theme.greenBg}>
                            <CustomText style={{ color: 'white' }} text='选订' />
                        </TouchableHighlight>
                    }
                </View>
                {this._testAlert()}
            </View>
        )
    }

    _testAlert = () => {
        const {alertShow} = this.state;
        if (!this.props.highRisk || !this.props.highRisk.Level ==1 || !alertShow){return}
        return(
          <View  style={{position:'absolute',top:-94, height:global.screenHeight, width:global.screenWidth}}>
            <View style={curStyle.container2}>
            {//图片宽250 高300， 头部高35，底部高40
                <View style={{ marginHorizontal:8,backgroundColor:'#fff',width:300, borderRadius:8}}>
                  <View style={{height:40,alignItems:'center',justifyContent:'center',marginTop:5}}>
                      <CustomText  text='温馨提示' style={{fontSize:16}}/>
                  </View>
                  <ScrollView style={{width:'100%'}} keyboardShouldPersistTaps='handled'>
                         <HTMLView value={this.props.highRisk.Message} style={{ padding:12}} /> 
                  </ScrollView>
                  <TouchableOpacity 
                        style={{height:40,alignItems:'center',justifyContent:'center',marginTop:10,borderTopWidth:1,borderColor:Theme.lineColor}}
                        onPress={()=>{
                           this._hightRist()
                        }}>
                        <CustomText  text='确定' style={{fontSize:18,color:Theme.theme}}/>
                  </TouchableOpacity>
                </View>
              }
              </View>
          </View>
        )
    }

    _hightRist = () => {
        const { itemData} = this.state;
        // this._getTravelRule(itemData);
        this.setState({
            alertShow:false
        },()=>{
            this._toBackList(itemData); 
        })
    }

    _renderJourneyDetail = (flights, isFrom) => {
        if (Array.isArray(flights) && flights.length > 0) {
            let arriveDate = null;
            for (let item of flights) {
                if (arriveDate === null) {
                    arriveDate = Util.Date.toDate(item.ArrivalTime);
                } else {
                    let nextDate = Util.Date.toDate(item.DepartureTime);
                    item.transferTime = IntlFlightService.getTransferTime(arriveDate, nextDate);
                    arriveDate = Util.Date.toDate(item.ArrivalTime);
                }
            }
            let isChinese = Util.Parse.isChinese();
            const { airPortData } = this.params;
            const {craftTypeList} = this.state
            let DepartureAirport = '';
            let ArrivalAirport = '';
            let DepartureCityEnName = '';
            let ArrivalCityEnName = '';
            return (
                <View  style={{ backgroundColor: 'white',paddingBottom:15}}>
                {
                    flights.map((item, index) => (
                        <View  style={{  }}>
                             {
                                airPortData.map((airPorItem)=>{
                                    if(airPorItem.AirportCode == item['DepartureAirport']){
                                        ArrivalCityEnName = airPorItem.CityEnName
                                        DepartureAirport = airPorItem.AirportEnName
                                    }
                                    if(airPorItem.AirportCode == item['ArrivalAirport']){
                                        ArrivalAirport = airPorItem.AirportEnName
                                        DepartureCityEnName = airPorItem.CityEnName
                                    }
                                })
                            }
                            {
                                item.transferTime ? (
                                    <View style={{marginTop:10,paddingHorizontal:15}}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center',}}>
                                            <Image source={require('../../res/Uimage/yuan_d.png')} style={{width:14,height:14,marginRight:5}}/>
                                            <Text allowFontScaling={false} style={{ color: Theme.orangeColor, fontSize: 12 }}>
                                                {I18nUtil.translate('中转')} {isChinese ? item.DepartureCityName : item.DepartureCityEname}  {item.transferTime} 
                                                {!(flights[index-1].ArrivalAirport == flights[index].DepartureAirport)?'(不同机场转机)':''}
                                            </Text>
                                        </View>
                                        {
                                            (!flights[index-1].ArrivalAirport == flights[index].DepartureAirport)?
                                            <Text allowFontScaling={false} style={{ color: Theme.assistFontColor, fontSize: 11,marginLeft:20 }}>
                                                { flights[index-1].ArrivalAirportName+'换成'+flights[index].DepartureAirportName + '请合理安排您的时间和行程'}
                                            </Text>:null
                                        }
                                    </View>
                                ) : null
                            }
                            <View style={{backgroundColor: Theme.lineColor2,marginHorizontal:15,marginTop:10,borderRadius:4,paddingHorizontal:20,paddingTop:10}}>
                                <View style={{ flexDirection: 'row',  }}>
                                    <View style={{ flex: 1 }}>
                                        <Text allowFontScaling={false} style={{ fontSize: 13, color:Theme.commonFontColor }}>{Util.Date.toDate(item.DepartureTime).format('yyyy-MM-dd')}</Text>
                                        <Text allowFontScaling={false} style={{ fontSize: 26, color:Theme.fontColor }}>{Util.Date.toDate(item.DepartureTime).format('HH:mm')}</Text>
                                        <Text allowFontScaling={false} style={{ color: Theme.commonFontColor, fontSize: 12, marginTop:5 }}>{Util.Parse.isChinese() ? item.DepartureAirportName : DepartureAirport} {item.DepartureTerminal}</Text>
                                    </View>
                                    <View style={{alignItems:'center',justifyContent:'center'}}>
                                        {
                                            item.Duration ? (
                                                <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 12 }}>{item.Duration.replace(':', 'h')}</Text>
                                            ) : null
                                        }
                                        {
                                            item.StopOvers ?
                                            <TouchableOpacity onPress={this._getFlightStopInfo.bind(this, data)}>
                                                <Image source={Util.Parse.isChinese() ? require('../../res/Uimage/flightFloder/_zstop.png') : require('../../res/Uimage/flightFloder/_estop.png')} style={{ width: 60, height: 10 }}></Image>
                                            </TouchableOpacity>
                                            : 
                                            <Image source={require('../../res/Uimage/arrow.png')} style={{ width: 60, height: 3 }}></Image>
                                        }
                                        <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 12 }}>{item.StopOvers ?item.StopOvers[0].CityName:''}</Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                        <Text allowFontScaling={false} style={{ fontSize: 13, color:Theme.commonFontColor  }}>{Util.Date.toDate(item.ArrivalTime).format('yyyy-MM-dd')}</Text>
                                        <Text allowFontScaling={false} style={{ fontSize: 26, color:Theme.fontColor  }}>{Util.Date.toDate(item.ArrivalTime).format('HH:mm')}</Text>
                                        <Text allowFontScaling={false} style={{ color: Theme.commonFontColor, fontSize: 12, marginTop:5 }}>{Util.Parse.isChinese() ? item.ArrivalAirportName : ArrivalAirport} {item.ArrivalTerminal}</Text>
                                    </View>
                                </View>
                                <Text allowFontScaling={false} style={{ color: Theme.assistFontColor, fontSize: 12,marginTop:10,marginBottom:10 }}>
                                <CropImage code={item.Airline} ></CropImage>
                                    {Util.Parse.isChinese() ? item.AirlineName : ""}{item.Airline}{item.FlightNumber} | {Util.Read.planType(item.Equipment, craftTypeList)} | {I18nUtil.translate(item.MealDesc)}</Text>
                            </View>
                        </View>
                    ))
                }
                </View>
            )
        }
        return null;
    }

    _renderJourney = (journey, isFrom) => {
        if (!journey) {
            return null;
        }
        if (journey.showDetail === undefined) {
            journey.showDetail = true;
        }
        let isChinese = Util.Parse.isChinese();
        // let toggleImg = journey.showDetail ? require('../../../res/image/orderClose.png') : require('../../../res/image/orderOpen.png');
        {/* {isChinese ? journey.DepartureCityName : journey.departurnEname}-{isChinese ? journey.ArrivalCityName : journey.arrivalEname} */}
        return (
            <View style={{}}>
                <View style={{backgroundColor:Theme.greenBg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',paddingHorizontal:20,paddingVertical:10}}>
                  <View style={{flexDirection:'row',alignItems:'center'}}>
                  {
                        isFrom ? (
                            <View style={{ marginRight:5}}>
                                <CustomText style={{ fontSize: 11, color: 'white',backgroundColor: Theme.theme, paddingHorizontal: 4,borderRadius:2, }} text='去程' />
                            </View>
                        ) : (
                            <View style={{fontSize: 11, color: 'white',backgroundColor: Theme.theme, paddingHorizontal: 4,borderRadius:2, }}>
                                <CustomText style={{ fontSize: 11, color: 'white' }} text='回程' />
                            </View>
                        )
                  }
                  <Text allowFontScaling={false} style={{ color:Theme.theme,fontSize:14 }} numberOfLines={1}>{journey.beginDate && journey.beginDate.format('yyyy-MM-dd')} </Text>
                  { Util.Parse.isChinese() ? <CustomText text={Util.Date.getWeekDesc(journey.beginDate)} style={{ color: Theme.theme }} /> : null}
                  </View>  
                  <Text allowFontScaling={false} style={{ color:Theme.theme,fontSize: 13}} numberOfLines={1}>{I18nUtil.translate('总时长')} {journey.durationDesc}</Text>
                </View>
                {
                    this._renderJourneyDetail(journey.FlightSegments, isFrom)
                }
            </View>
        );
    }
}
const getStateProps = state => ({
    compSwitch:state.compSwitch.bool,
    highRisk:state.highRisk.highRisk,
    apply: state.apply.apply,
    customerInfo_userInfo:state.customerInfo_userInfo,
    comp_userInfo:state.comp_userInfo
})
export default connect(getStateProps)(IntlFlightMoreScreen);
const curStyle = StyleSheet.create({
    borderTop: {
        borderTopColor: Theme.lineColor,
        borderTopWidth: 1
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    titleText: {
        fontSize: 16,
        color: Theme.fontColor
    },
    container2:{
        flex:1,
        backgroundColor:'rgba(0, 0, 0, 0.4)',
        justifyContent:'center',
        alignItems:'center'
    }, 
});

/**
 * 获取航司名称
 */
const getAirlineName = (airlineCode) => {
    if (airlines && Array.isArray(airlines)) {
        let index = airlines.findIndex(airline => (airline.Code === airlineCode));
        if (index === -1) {
            return null;
        }
        return airlines[index].CnShortName;
    }
}