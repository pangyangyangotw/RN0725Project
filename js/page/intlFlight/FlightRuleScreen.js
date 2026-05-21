import React from 'react';
import SuperView from '../../super/SuperView';
import {
    View,
    Text,
    StyleSheet,
    TouchableHighlight
} from 'react-native';
import Theme from '../../res/styles/Theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import I18nUtil from '../../util/I18nUtil';
import ViewUtil from '../../util/ViewUtil';
import Util from '../../util/Util';
import CustomText from '../../custom/CustomText';
import NavigationUtils from '../../navigator/NavigationUtils';
import {connect} from 'react-redux';
class FlightRuleScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '超标原因'
        };
        this.state = {
            lowPriceData: null,
            beforeDayData: null,
            cabinDisCountData: null
        }
    }
    componentDidMount() {
        let { lowPriceData, beforeDayData, cabinDisCountData } = this.state;
        let data = this.params.MatchTravelRules;
        if (data) {
            data.unmatchlist.forEach(obj => {
                if (obj.IsEnable == 1 && obj.LowPriceFight && obj.RuleType == 1) {
                    lowPriceData = {
                        LowestFlight: obj.LowPriceFight,
                        reasonList: data.reasonList,
                        NeedApproval: obj.NeedApproval
                    }
                }
                if (obj.IsEnable == 1 && obj.RuleType == 2) {
                    beforeDayData = {
                        reasonList: data.dayreasonlist,
                        Advanceday: obj.Advanceday,
                        NeedApproval: obj.NeedApproval

                    }
                }
                if (obj.IsEnable == 1 && obj.RuleType == 7) {
                    cabinDisCountData = {
                        reasonList: data.cabinDiscountRsnList,
                        Discount: obj.Discount,
                        NeedApproval: obj.NeedApproval
                    }
                }
            })
        }
        this.setState({
            lowPriceData,
            beforeDayData,
            cabinDisCountData
        })

    }
    _continueOrder = () => {
        const { lowPriceData, beforeDayData, cabinDisCountData } = this.state;
        if (lowPriceData && !lowPriceData.selectReaon) {
            this.toastMsg('请选择未选择最低价的原因');
            return;
        }
        if (beforeDayData && !beforeDayData.selectReaon) {
            this.toastMsg('请选择未选择提前预订的原因');
            return;
        }
        if (cabinDisCountData && !cabinDisCountData.selectReaon) {
            this.toastMsg('请选择未预订折扣舱位的原因');
            return;
        }
        let params = Util.Encryption.clone(this.params);
        let ruleModel = {
            MatchTravelRules: params.MatchTravelRules
        }
        let ruleModelArr = [];
        if (lowPriceData) {
            ruleModel.lowPriceReason = lowPriceData.selectReaon;
            var aline ={};
            var currentLowestFlight = JSON.parse(JSON.stringify((lowPriceData.LowestFlight)));
            var reason = {
              Reason: lowPriceData.selectReaon.Reason,
              ReasonEn: lowPriceData.selectReaon.ReasonEn,
              ReasonCode: lowPriceData.selectReaon.ReasonCode,
              CustomerReasonId: lowPriceData.selectReaon.Id,
              LowestFlight: Object.assign(currentLowestFlight, aline),
              RuleType: 1,
              OrderCategory: 1,
              NeedApproval:lowPriceData.NeedApproval,
            };
            ruleModelArr.push(reason);
        }
        if (beforeDayData) {
            ruleModel.beforeDayReason = beforeDayData.selectReaon;
            var dayreason = {
                CustomerReasonId: beforeDayData.selectReaon.Id,
                Reason: beforeDayData.selectReaon.Reason,
                ReasonEn: beforeDayData.selectReaon.ReasonEn,
                ReasonCode: beforeDayData.selectReaon.ReasonCode,
                LowestFlight: null,
                RuleType: 2,
                OrderCategory: 1,
                NeedApproval:beforeDayData.NeedApproval,
                AdvanceDays: beforeDayData.Advanceday
            };
            ruleModelArr.push(dayreason);
        }
        if (cabinDisCountData) {
            ruleModel.cabinDiscountReason = cabinDisCountData.selectReaon;
            var cabinReason = {
                CustomerReasonId: cabinDisCountData.selectReaon.Id,
                Reason: cabinDisCountData.selectReaon.Reason,
                ReasonEn: cabinDisCountData.selectReaon.ReasonEn,
                ReasonCode: cabinDisCountData.selectReaon.ReasonCode,
                RuleType: 7,
                OrderCategory: 1,
                NeedApproval: cabinDisCountData.NeedApproval,
                CabinDiscountLimit: cabinDisCountData.Discount
            };
            ruleModelArr.push(cabinReason);
        }
        params.goRuleModel = ruleModel;
        params.goRuleModelArr = ruleModelArr;

       
        // if (lowPriceData) {
        //     params.goFlightData.LowestFlight = lowPriceData.LowestFlight;
        // }
        if (params.isRt) {
            this.push('IntlFlightRtListScreen', { ...params });
        } else {
            this._convertToOrder(this.params.journey,params.goRuleModel,params.goRuleModelArr);
        }
    }

     /**
     * 转换为订单model
     */
    _convertToOrder = (journey,goRuleModel,goRuleModelArr) => {
        const { queryModel } = this.params;
        const {compSwitch} = this.props;
        if (!journey) {
            return;
        }
        this.order = {
            DepartureNationalCode: queryModel.DepartureNationalCode,
            DestinationNationalCode: queryModel.DestinationNationalCode,
            Departure: journey.OWFlights.DepartureCityName,  //journey.OWFlights.departurnName,
            DepartureCode: journey.OWFlights.DepartureAirport,
            Destination: journey.OWFlights.ArrivalCityName,//journey.OWFlights.arrivalName,
            DestinationCode: journey.OWFlights.ArrivalAirport,
            JourneyType: this.isRt ? 2 : 1,//1:单程，2:往返
            IsCustomTrip: this.isCustomerTab,
            AirList: [],
            BasePrice: journey.BasePrice,
            Tax: journey.Tax,
            SettlementPrice: journey.SettlementPrice,
            TotalPrice: journey.TotalPrice,
            TicketingCarrier: journey.TicketingCarrier,
            AccountCode: null,
            PriceList:journey.PriceList,
        };
        this._processFlights(journey.OWFlights, journey.RTFlights ? 21 : 1, journey.IntlFlightRules, 0);
        this._processFlights(journey.RTFlights, 22, journey.IntlFlightRules, 1);
        compSwitch?
        this.push('InflFlight_compCreateOrderScreen', {
            key: this.params.key,
            order: this.order,
            journey: journey,
            goRuleModel:goRuleModel,
            goRuleModelArr: goRuleModelArr
        })
        : this.push('IntlFlightCreateOrder', {
            key: this.params.key,
            order: this.order,
            journey: journey,
            goRuleModel:goRuleModel,
            goRuleModelArr: goRuleModelArr
        })    
    }

    _processFlights = (flights, journeyType, policyList, policyIndex) => {
        if (!flights || !Array.isArray(flights.FlightSegments)) {
            return;
        }
        flights.FlightSegments.forEach(item => {
            var flightOrder = {
                Departure: item.DepartureCityName,
                DepartureEname: item.DepartureCityEname,
                DepartureCode: item.DepartureCityCode,
                DepartureNationalCode: item.DepartureNationalCode,
                DepartureNationalName: item.DepartureNationalName,
                DepartureAirport: item.DepartureAirport,
                DepartureAirportName: item.DepartureAirportName,

                Destination: item.ArrivalCityName,
                DestinationEname: item.ArrivalCityEname,
                DestinationCode: item.ArrivalCityCode,
                DestinationNationalCode: item.ArrivalNationalCode,
                DestinationNationalName: item.ArrivalNationalName,
                DestinationAirport: item.ArrivalAirport,
                DestinationAirportName: item.ArrivalAirportName,

                AirlineCode: item.Airline,
                AirlineName: item.AirlineName,
                AirlineNumber: item.FlightNumber,
                DepartureTerminal: item.DepartureTerminal,
                DestinationTerminal: item.ArrivalTerminal,
                DepartureTime: Util.Date.toDate(item.DepartureTime),
                DestinationTime: Util.Date.toDate(item.ArrivalTime),
                EquipType: item.Equipment,
                EquipmentDesc: item.EquipmentDesc,
                RouteType: journeyType,
                FlightTotalTime: item.Duration,
                CabinCode: item.ExInfos && item.ExInfos[0].PhysicalCabin,
                CabinName: item.ExInfos && item.ExInfos[0].CabinName,
                ServiceCabin: item.ExInfos && item.ExInfos[0].ResBookDesigCode,

                Tpm: item.TPM,
                BaggagePolicy: item.ExInfos && item.ExInfos[0].Baggage,
                StopOver: item.StopOvers,
                 Meal:item.Meal,
                 MealDesc:item.MealDesc
            };
            if (item.ShareAirlineCode) {
                flightOrder.ShareAirlineCode = item.ShareAirlineCode;
                flightOrder.ShareAirlineNumber = item.ShareAirlineNumber;
                flightOrder.ShareAirlineName = item.ShareAirlineName;
            }
            if (policyList && Array.isArray(policyList)) {
                //获取退改规则
                if (policyList[policyIndex]) {
                    flightOrder.ModifyPolicy = {
                        Intro: policyList[policyIndex].Intro,
                        Rules: policyList[policyIndex].Rules
                    }
                }
            }
            this.order.AirList.push(flightOrder);
        });
    }

    _selectReason = (index) => {
        const { lowPriceData, beforeDayData, cabinDisCountData } = this.state;
        let reasonList = index === 0 ? lowPriceData.reasonList : (index === 1 ? beforeDayData.reasonList : cabinDisCountData.reasonList);
        let selectReason = index === 0 ? lowPriceData.selectReaon : (index === 1 ? beforeDayData.selectReaon : cabinDisCountData.selectReaon);
        let title = index === 0 ? '未选择最低价' : (index === 1 ? '未提前预订的原因' : '未选择指定折扣舱位')
        this.push('RuleReasonSelect', {
            reason: reasonList, select: selectReason, title: title, callBack: (reason) => {
                if (index === 0) {
                    if(reason.RuleTypeDesc=='None'){
                        reason.RuleTypeDesc='未选择最低价原因'
                    }
                    lowPriceData.selectReaon = reason;
                } else if (index === 1) {
                    if(reason.RuleTypeDesc=='None'){
                        reason.RuleTypeDesc='未提前预订的原因'
                    }
                    beforeDayData.selectReaon = reason;
                } else if (index === 2) {
                    if(reason.RuleTypeDesc=='None'){
                        reason.RuleTypeDesc='未选择指定折扣舱位'
                    }
                    cabinDisCountData.selectReaon = reason;
                }
                this.setState({});
            }
        });
    }


    renderBody() {
        const { lowPriceData, cabinDisCountData, beforeDayData } = this.state;
        if (lowPriceData && lowPriceData.LowestFlight) {
            lowPriceData.LowestFlight.DepartureDate = Util.Date.toDate(lowPriceData.LowestFlight.DepartureTime);
        }
        return (
            <View style={{ flex: 1 }}>
                <View style={{ flex: 1 }}>
                {
                    lowPriceData ?
                        <View style={styles.view}>
                            <View style={styles.viewHeader}>
                                <View style={{ flexDirection: 'row' }}>
                                        <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={'1.'} />
                                        <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={'违背最低价限制'} />
                                </View>
                                <CustomText text='根据贵公司差旅政策规定，您未选择最低价舱位航班，故请您选择原因:' />
                            </View>
                            <TouchableHighlight underlayColor='transparent' onPress={this._selectReason.bind(this, 0)}>
                                <View style={styles.viewCenter}>
                                    <CustomText style={{ color: lowPriceData.selectReaon ? Theme.commonFontColor : Theme.promptFontColor}} text={lowPriceData.selectReaon ? (Util.Parse.isChinese()? lowPriceData.selectReaon.Reason:lowPriceData.selectReaon.ReasonEn) : '请选择'} />
                                    <Ionicons name={'chevron-forward'}
                                        size={20}
                                        style={{ color: 'lightgray' }}
                                    />
                                </View>
                            </TouchableHighlight>
                        </View>
                        : null
                }
                {
                    beforeDayData ?
                        <View style={styles.view}>
                            <View style={styles.viewHeader}>
                                <View style={{ flexDirection: 'row' }}>
                                    <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={this.state.lowPriceData ? '2.' : '1.'} />
                                    <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={'违背提前天数限制'} />
                                </View>
                                <Text style={{ flex: 1, color:'black' }}>
                                    {
                                       Util.Parse.isChinese()?
                                       `根据贵公司差旅政策规定，您未提前${beforeDayData.Advanceday}天预订航班，故请您选择原因:`
                                       : I18nUtil.tranlateInsert('根据贵公司差旅政策规定，您未提前{{noun}}天预订航班，故请您选择原因:', beforeDayData.Advanceday)
                                    }
                                </Text>
                            </View>
                            <TouchableHighlight underlayColor='transparent' onPress={this._selectReason.bind(this, 1)}>
                                <View style={styles.viewCenter}>
                                    <CustomText style={{ color: beforeDayData.selectReaon ? Theme.commonFontColor : Theme.promptFontColor }} text={beforeDayData.selectReaon ? (Util.Parse.isChinese()?beforeDayData.selectReaon.Reason:beforeDayData.selectReaon.ReasonEn) : '请选择'} />
                                    <Ionicons name={'chevron-forward'}
                                        size={20}
                                        style={{ color: 'lightgray' }}
                                    />
                                </View>
                            </TouchableHighlight>
                        </View>
                        : null
                }
                {
                    cabinDisCountData ?
                        <View style={styles.view}>
                            <View style={styles.viewHeader}>
                            {/* <Text>{(this.state.beforeDayData&&this.state.lowPriceData)?(3 + '、'):(this.state.beforeDayData || this.state.lowPriceData ? 2 + '、' : 1 + '、')}</Text> */}
                            <View style={{ flexDirection: 'row' }}>
                                <CustomText style={{ fontSize: 16, fontWeight: "bold" }} text={'违背折扣限制'} />
                                <Text style={{ fontSize: 16, fontWeight: "bold", color: Theme.fontColor }}>{(this.state.beforeDayData && this.state.lowPriceData) ? '3.' : (this.state.beforeDayData || this.state.lowPriceData ? '2.' : '1.')}</Text>
                            </View>
                            <Text style={{ color: Theme.commonFontColor, fontSize: 13, marginTop: 10}}>
                                {  
                                    Util.Parse.isChinese()?
                                    `根据贵公司差旅政策规定，您未选择经济舱${cabinDisCountData.Discount == 0?'全部':cabinDisCountData.Discount}折以内航班，故请您选择原因)`
                                    :
                                    I18nUtil.tranlateInsert('根据贵公司差旅政策规定，您未选择经济舱{{noun}}折以内航班，故请您选择原因:', ( cabinDisCountData.Discount == 0 ? '全部':(cabinDisCountData.Discount*10 + '%0ff')))
                                }
                            </Text>
                            </View>
                            <TouchableHighlight underlayColor='transparent' onPress={this._selectReason.bind(this, 2)}>
                                <View style={styles.viewCenter}>
                                    <CustomText style={{ color: cabinDisCountData.selectReaon ? Theme.commonFontColor : Theme.promptFontColor }} text={cabinDisCountData.selectReaon ? (Util.Parse.isChinese()? cabinDisCountData.selectReaon.Reason:cabinDisCountData.selectReaon.ReasonEn) : '请选择'} />
                                    <Ionicons name={'chevron-forward'}
                                        size={20}
                                        style={{ color: 'lightgray' }}
                                    />
                                </View>
                            </TouchableHighlight>
                        </View>
                        : null
                }
                </View>
                {
                    ViewUtil.getThemeButton('继续预订', this._continueOrder)
                }
                {/* {
                    lowPriceData && lowPriceData.LowestFlight ?
                        <View style={{ margin: 10 }}>
                            <CustomText text={'根据贵公司差旅政策规定，您选择的时间段内的最低价航班为：'}/>
                            <Text style={{ fontSize: 18, marginTop: 5 }}>{Util.Parse.isChinese() ? lowPriceData.LowestFlight.AirCodeDesc : lowPriceData.LowestFlight.AirCode} {lowPriceData.LowestFlight.AirCode + lowPriceData.LowestFlight.FlightNumber} {lowPriceData.LowestFlight.DepartureDate.format('HH:mm', false)}{I18nUtil.translate('起飞')} ¥{lowPriceData.LowestFlight.Price}</Text>
                        </View> :
                        null
                } */}
            </View>
        )
    }
}


const getPropsState = state => ({
    compSwitch:state.compSwitch.bool
})
export default connect(getPropsState)(FlightRuleScreen)

const styles = StyleSheet.create({
    view: {
        margin: 10,
        backgroundColor: 'white',
        borderRadius: 6
    },
    viewHeader: {
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        paddingVertical: 10,
        marginHorizontal: 20
    },
    viewCenter: {
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: "center",
        paddingHorizontal: 20
    }
})