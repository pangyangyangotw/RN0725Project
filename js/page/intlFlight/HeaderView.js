import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableHighlight,
    StyleSheet
} from 'react-native';
import PropTypes from 'prop-types'
import Util from '../../util/Util';
import InflFlightService from '../../service/InflFlightService';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import I18nUtil from '../../util/I18nUtil';
import airlines from '../../res/js/airline';
import ViewUtil from '../../util/ViewUtil';
import CropImage  from '../../custom/CropImage';

export default class HeaderView extends React.Component {
    static propTypes = {
        order: PropTypes.object.isRequired,
        showRules:PropTypes.func.isRequired
    }
    constructor(props) {
        super(props);
        this.state = {
            
        }
    }

    _renderFlightDetail = (flight, index, isFrom, DepartureAirport, ArrivalAirport) => {
        if (!flight) {
            return null;
        }
        let shareTxt = '';
        if (flight.ShareAirlineCode && flight.ShareAirlineNumber) {
            // shareTxt = `实际共享航班 ${flight.ShareAirlineName} ${flight.ShareAirlineCode}${flight.ShareAirlineNumber}`;
            shareTxt = I18nUtil.translate('实际承运') + ' ' + (Util.Parse.isChinese() ? flight.ShareAirlineName : getAirlineEngliSHName(flight.ShareAirlineCode)) + flight.ShareAirlineCode + flight.ShareAirlineNumber;
        }
        let diffday = Util.Date.getDiffDay(flight.DepartureTime, flight.DestinationTime);
        return (
            <View key={index} style={{ borderBottomColor: Theme.lineColor, borderBottomWidth: 1, paddingVertical: 5}}>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ flex: 1 }}>
                        <Text allowFontScaling={false} style={{ fontSize: 13, color:Theme.commonFontColor }}>{flight.DepartureTime && flight.DepartureTime.format('yyyy-MM-dd')}</Text>
                        <Text allowFontScaling={false} style={{ fontSize: 26, color:Theme.fontColor }}>{flight.DepartureTime && flight.DepartureTime.format('HH:mm')}</Text>
                        <Text allowFontScaling={false} style={{ color: Theme.commonFontColor, fontSize: 12, marginTop:5 }}>{Util.Parse.isChinese() ? flight.DepartureAirportName :flight.DepartureAirport}</Text>
                    </View>
                    <View style={{alignItems:'center',justifyContent:'center'}}>
                        {
                            flight.FlightTotalTime ? (
                                <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 12 }}>{flight.FlightTotalTime.replace(':', 'h') }</Text>
                            ) : null
                        }
                        <Image source={require('../../res/Uimage/arrow.png')} style={{ width: 60, height: 3 }}></Image>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text allowFontScaling={false} style={{ fontSize: 13, color:Theme.commonFontColor  }}>{flight.DestinationTime && flight.DestinationTime.format('yyyy-MM-dd')}</Text>
                        <View style={{flexDirection:'row'}}>
                        <Text allowFontScaling={false} style={{ fontSize: 26, color:Theme.fontColor  }}>{flight.DestinationTime && flight.DestinationTime.format('HH:mm')}</Text>
                        {
                            diffday > 0 ?
                                <CustomText style={{ marginRight: -11, fontSize: 10, marginLeft: 3 }} text={'+' + diffday } />
                            : null
                        }</View>
                        <Text allowFontScaling={false} style={{ color: Theme.commonFontColor, fontSize: 12, marginTop:5 }}>{Util.Parse.isChinese() ? flight.DestinationAirportName : flight.DestinationAirport}</Text>
                        
                    </View>
                </View>
                <Text allowFontScaling={false} style={{ color: Theme.assistFontColor, fontSize: 12,marginTop:20,marginBottom:10,alignItems:'center' }}>
                    <CropImage code={flight.AirlineCode} ></CropImage>
                    {Util.Parse.isChinese() ? flight.AirlineName : ''}{flight.AirlineCode}{flight.AirlineNumber} {flight.EquipmentDesc}  {Util.Parse.isChinese() ? (flight.CabinName + flight.ServiceCabin) : (flight.CabinCode + flight.ServiceCabin) + ' '} {shareTxt}
                </Text>
            </View>
        );
    }

    _renderFlights = (flights, isFrom) => {
        const {airportEnName} = this.props;
        let DepartureAirport = '';
        let ArrivalAirport = '';
        let DepartureCityEnName = '';
        let ArrivalCityEnName = '';
        if (flights && flights.length > 0) {
            return flights.map((item, index) => {
                airportEnName&&airportEnName.map((airPorItem)=>{
                    if(airPorItem.AirportCode == item['DepartureAirport']){
                        ArrivalCityEnName = airPorItem.CityEnName
                        DepartureAirport = airPorItem.AirportEnName
                    }
                    if(airPorItem.AirportCode == item['DestinationAirport']){
                        ArrivalAirport = airPorItem.AirportEnName
                        DepartureCityEnName = airPorItem.CityEnName
                    }
                })
                return this._renderFlightDetail(item, index, isFrom,DepartureAirport, ArrivalAirport);
            });
        }
        return null;
    }

     /** 
     * 超标原因
     */
      _standerReason = (theRuleModel) => {
        const {otwThis } = this.props;
        if (!theRuleModel) return;
        let ruleModel = theRuleModel
        let reason = '';
        if (ruleModel.lowPriceReason) {
            // reason += I18nUtil.translate(ruleModel.lowPriceReason.RuleTypeDesc)  + ":" + I18nUtil.translate(ruleModel.lowPriceReason.Reason ) + '\n';
            reason += ruleModel.lowPriceReason.RuleTypeDesc + ":" + (Util.Parse.isChinese() ? ruleModel.lowPriceReason.Reason : ruleModel.lowPriceReason.ReasonEn) + '\n';
        }
        if (ruleModel.beforeDayReason) {
            // reason += I18nUtil.translate(ruleModel.beforeDayReason.RuleTypeDesc) + ':' + I18nUtil.translate(ruleModel.beforeDayReason.Reason) + '\n';
            reason += ruleModel.beforeDayReason.RuleTypeDesc + ":" + (Util.Parse.isChinese() ? ruleModel.beforeDayReason.Reason : ruleModel.beforeDayReason.ReasonEn) + '\n';
        }
        if (ruleModel.cabinDiscountReason) {
            // reason += I18nUtil.translate(ruleModel.cabinDiscountReason.RuleTypeDesc) + ":" + I18nUtil.translate(ruleModel.cabinDiscountReason.Reason);
            reason += ruleModel.cabinDiscountReason.RuleTypeDesc + ":" + (Util.Parse.isChinese() ? ruleModel.cabinDiscountReason.Reason : ruleModel.cabinDiscountReason.ReasonEn) + '\n';
        }
        if (ruleModel.canbinDataReason) {
            // reason += I18nUtil.translate(ruleModel.cabinDiscountReason.RuleTypeDesc) + ":" + I18nUtil.translate(ruleModel.cabinDiscountReason.Reason);
            reason += ruleModel.canbinDataReason.RuleTypeDesc + ":" + (Util.Parse.isChinese() ? ruleModel.canbinDataReason.Reason : ruleModel.canbinDataReason.ReasonEn) + '\n';
        }
        if (!reason) {
            otwThis.toastMsg('该订单无超标');
        } else {
            otwThis.showAlertView(reason, () => {
                return ViewUtil.getAlertButton('确定', () => {
                    otwThis.dismissAlertView();
                })
            });
        }
    }

    render() {
        const { order,showRules,goRuleModel ,backRuleModel,ContainsNoChange,ContainsNoRefund,ContainsNoChange_r,ContainsNoRefund_r } = this.props;
        const { AirList, BasePrice, Tax, TotalPrice } = order;
        let owJourney = { list: [] };
        let rtJourney = { list: [] };
        let lastDate = null;
        let isChinese = Util.Parse.isChinese();
        AirList.forEach(journey => {
            if (journey.RouteType === 22) {
                rtJourney.list.push(journey);
            } else {
                owJourney.list.push(journey);
            }
        });
        owJourney.list.forEach((flight, index) => {
            if (index === 0) {
                owJourney.Departure = flight.Departure;
                owJourney.DepartureEname = flight.DepartureEname;
                owJourney.DepartureTime = flight.DepartureTime;
                lastDate = flight.DestinationTime;
            } else {
                flight.transferTime = InflFlightService.getTransferTime(lastDate, flight.DepartureTime);
                lastDate = flight.DestinationTime;
            }
            if (index === owJourney.list.length - 1) {
                owJourney.Destination = flight.Destination;
                owJourney.DestinationEname = flight.DestinationEname;
                // owJourney.DestinationTime = flight.DestinationTime;
            }
        });
        rtJourney.list.forEach((flight, index) => {
            if (index === 0) {
                rtJourney.Departure = flight.Departure;
                rtJourney.DepartureEname = flight.DepartureEname;
                rtJourney.DepartureTime = flight.DepartureTime;
                lastDate = flight.DestinationTime;
            } else {
                flight.transferTime = InflFlightService.getTransferTime(lastDate, flight.DepartureTime);
                lastDate = flight.DestinationTime;
            }
            if (index === rtJourney.list.length - 1) {
                rtJourney.Destination = flight.Destination;
                rtJourney.DestinationEname = flight.DestinationEname;
                // rtJourney.DestinationTime = flight.DestinationTime;
            }
        });
        let owAllowPieces = owJourney.list[0]?.BaggagePolicy?.AllowPieces|| 0;
        let owAllowWeight = owJourney.list[0]?.BaggagePolicy?.AllowWeight|| 0;
        let rtAllowPieces = rtJourney.list[0]?.BaggagePolicy?.AllowPieces|| 0;
        let rtAllowWeight = rtJourney.list[0]?.BaggagePolicy?.AllowWeight|| 0;
        let owText = (owAllowPieces==0 && owAllowWeight==0)?'无免费行李':null
        let rtText = (rtAllowPieces==0 && rtAllowWeight==0)?'无免费行李':null
        return (
            <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 6 , borderColor:Theme.greenBg,marginHorizontal:10,marginTop:10}}>
                    {
                        owJourney.list.length > 0 ?  
                            <View style={styles.headerRowView}>
                                <View style={{flexDirection:'row'}}>
                                    {
                                        <View style={styles.lostyle} >
                                            <CustomText text={'去'} style={{ color: 'white',fontSize:12 }} />
                                        </View>
                                    }
                                    <CustomText style={{ fontSize: 14 }} text={' ('} />
                                    <CustomText style={{ fontSize:14 }} text={owJourney.DepartureTime && owJourney.DepartureTime.format('yyyy-MM-dd') + owJourney.DepartureTime.getWeek()} />
                                    <CustomText text={')'} />
                                </View>
                                <View style={{flexDirection:'row'}}>
                                    <CustomText style={{ color: Theme.theme, fontSize: 12 ,textDecorationLine: 'underline',textDecorationStyle:'solid'}} onPress={()=>showRules(1)} text='退改规则' />
                                    <CustomText style={{ color: Theme.theme, fontSize: 12,marginLeft:5, textDecorationLine: 'underline',textDecorationStyle:'solid' }} onPress={()=>showRules(2)} text='行李说明' />
                                </View>
                            </View>
                        :null
                    }
                    {
                        ContainsNoRefund && !ContainsNoChange?
                        <CustomText style={{ color: Theme.redColor, fontSize: 12,textAlign: 'right' }}  text='不允许退票' />
                        :null
                    }
                    {
                        ContainsNoChange && !ContainsNoRefund?
                        <CustomText style={{ color: Theme.redColor, fontSize: 12,textAlign: 'right' }}  text='不允许改签' />
                        :null
                    }
                    {
                        ContainsNoChange && ContainsNoRefund?
                        <CustomText style={{ color: Theme.redColor, fontSize: 12,textAlign: 'right' }}  text='不允许退改' />
                        :null
                    }
                    {owText?<CustomText style={{ color: Theme.redColor, fontSize: 12,textAlign: 'right' }}  text={owText} />:null}
                    {this._renderFlights(owJourney.list, true)}
                    {
                        rtJourney.list.length > 0 ?  
                            <View style={[styles.headerRowView,{marginTop:10}]}>
                                <View style={{flexDirection:'row'}}>
                                    {
                                        <View style={styles.lostyle} >
                                            <CustomText text={'回'} style={{ color: 'white',fontSize:12 }} />
                                        </View>
                                    }
                                    <CustomText style={{ fontSize: 14 }} text={' ('} />
                                    <CustomText style={{ fontSize:14 }} text={rtJourney.DepartureTime && rtJourney.DepartureTime.format('yyyy-MM-dd') + rtJourney.DepartureTime.getWeek()} />
                                    <CustomText text={')'} />
                                </View>
                                <View style={{flexDirection:'row'}}>
                                    <CustomText style={{ color: Theme.theme, fontSize: 12 ,textDecorationLine: 'underline',textDecorationStyle:'solid'}} onPress={()=>showRules(1)} text='退改规则' />
                                    <CustomText style={{ color: Theme.theme, fontSize: 12,marginLeft:5, textDecorationLine: 'underline',textDecorationStyle:'solid' }} onPress={()=>showRules(2)} text='行李说明' />
                                </View>
                            </View>
                        :null
                    }
                    {
                        rtJourney.list.length > 0 && (!ContainsNoChange_r && ContainsNoRefund_r) ?
                        <CustomText style={{ color: Theme.redColor, fontSize: 12,textAlign: 'right' }} onPress={()=>showRules(1)} text='不允许退票' />
                        :null
                    }
                    {
                        rtJourney.list.length > 0 && (ContainsNoChange_r && !ContainsNoRefund_r) ?
                        <CustomText style={{ color: Theme.redColor, fontSize: 12,textAlign: 'right' }} onPress={()=>showRules(1)} text='不允许改签' />
                        :null
                    }
                    {
                        rtJourney.list.length > 0 && (ContainsNoChange_r && ContainsNoRefund_r) ?
                        <CustomText style={{ color: Theme.redColor, fontSize: 12,textAlign: 'right' }} onPress={()=>showRules(1)} text='不允许退改' />
                        :null
                    }
                    
                    {rtJourney.list.length > 0 && rtText?<CustomText style={{ color: Theme.redColor, fontSize: 12,textAlign: 'right' }} onPress={()=>showRules(1)} text={rtText} />:null}
                    {this._renderFlights(rtJourney.list, false)}
                    {
                        backRuleModel?
                        <View style={{flexDirection:'row',marginVertical: 5,}}>
                            <CustomText style={{  color: Theme.theme, fontSize: 12, fontWeight: 'bold' }} onPress={()=>{this._standerReason(backRuleModel)}} text='超标原因' /> 
                        </View>:null
                    }
                    
                    <View style={{ marginVertical: 5, flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ justifyContent: 'center' }}>
                                <Text allowFontScaling={false} style={{ color: Theme.commonFontColor, fontSize: 12 }}>{I18nUtil.translate('机票价')}：¥{BasePrice}    {I18nUtil.translate('税费')}：¥{Tax}</Text>
                            </View>
                    </View>
            </View>
        )
    }
}
const getAirlineEngliSHName = (airlineCode) => {
    if (airlines && Array.isArray(airlines)) {
        let index = airlines.findIndex(airline => (airline.Code === airlineCode));
        if (index === -1) {
            return null;
        }
        return airlines[index].EnFullName;
    }
}

var styles = StyleSheet.create({
    iconView: {
        marginLeft: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Theme.theme
    },
    headerRowView: {
        flexDirection: 'row',
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingVertical: 5,
        justifyContent:'space-between'
    },
    tipSupperly: {
        backgroundColor: Theme.theme,
        color: 'white',
        fontSize: 1,
        marginLeft: 5,
        paddingHorizontal: 2,
        textAlign: 'center',
        borderRadius:2
    },
    xyStyle3:{
        borderRadius: 2, 
        color: Theme.orangeColor, 
        paddingHorizontal: 3, 
        fontSize: 11,
        marginRight:4,
        borderWidth:1,
        height:15,
        borderColor:Theme.orangeColor,
        textAlign:'center',
        justifyContent:'center',
        alignItems:'center',
    },
    lostyle:{ 
        backgroundColor: Theme.orangeColor, 
        marginRight: 5,
        // width:16,
        height:16,
        alignItems:'center',
        justifyContent: 'center',
        borderRadius:2,
        paddingHorizontal:2
    }
})