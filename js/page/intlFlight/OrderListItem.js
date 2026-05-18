import React from 'react';
import {
    TouchableHighlight,
    View,
    Text,
    StyleSheet,
    Image
} from 'react-native';
import IntlFlightEnum from '../../enum/IntlFlightEnum';
import Utils from '../../util/Util';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import NavigationUtils from '../../navigator/NavigationUtils';
import DashLine from '../../custom/Dashline';
import CommonService from '../../service/CommonService';

class OrderListItem extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            IsShowServiceFee:true,
            noChooseSeatAirlineConfig: [],
        }
    }

    _getNoChooseSeatSet = () => {
        const list = Array.isArray(this.state.noChooseSeatAirlineConfig) ? this.state.noChooseSeatAirlineConfig : [];
        const blocked = list
            .map((it) => {
                if (!it) return '';
                const v = (typeof it === 'string' || typeof it === 'number')
                    ? String(it)
                    : (it.Code || it.code || it.Airline || it.airline || it.AirlineCode || it.airlineCode || '');
                return String(v).trim().toUpperCase();
            })
            .filter(Boolean);
        return new Set(blocked);
    }

    _canChooseSeatByAirlines = (order) => {
        const o = order || {};
        const blockedSet = this._getNoChooseSeatSet();
        if (!blockedSet || blockedSet.size === 0) return true;

        const airlines = Array.isArray(o.OrderAirList) ? o.OrderAirList : [];
        if (airlines.length > 0) {
            return airlines.some((it) => {
                const code = it && (it.AirlineCode);
                const v = String(code || '').trim().toUpperCase();
                if (!v) return true;
                return !blockedSet.has(v);
            });
        }

        const singleCode = String(o.Airline || o.AirlineCode || o.Code || '').trim().toUpperCase();
        if (!singleCode) return true;
        return !blockedSet.has(singleCode);
    }

    _canChooseSeatByShareAirlineCode = (order) => {
        const o = order || {};
        const blockedSet = this._getNoChooseSeatSet();
        if (!blockedSet || blockedSet.size === 0) return true;
        const orderAirList = Array.isArray(o.OrderAirList) ? o.OrderAirList : [];
        if (orderAirList.length === 0) return true;
        return orderAirList.some((item) => {
            const shareCode = item && item.ShareAirlineCode;
            const v = String(shareCode || '').trim().toUpperCase();
            if (!v) return true;
            return !blockedSet.has(v);
        });
    }

    _toDetail = () => {
        NavigationUtils.push(this.props.navigation, 'IntlFlightOrderDetail', {order:this.props.order});
    }
   
    /**
     * 改签
     */
    _onReissue = () => {
    
        NavigationUtils.push(this.props.navigation, 'IntlFlightOrderReissue', { order: this.props.order });
    }
    /**
     * 退票
     */
    _onRefund = () => {
        
        NavigationUtils.push(this.props.navigation, 'IntlFlightOrderRefund', {order:this.props.order});
    }
  
    /**
     * 付款
     */
    _onPay = () => {
        const {otwThis} = this.props;
        otwThis.showLoadingView();
        CommonService.PaymentInfo({SerialNumber: this.props.order.PaymentSn}).then(response => {
            otwThis.hideLoadingView();
            if (response && response.success) {
                NavigationUtils.push(this.props.navigation, 'IntlFlightPayment', {SerialNumber:this.props.order.PaymentSn});
            } else {
                otwThis.toastMsg(response.message || '获取支付信息失败');
            }
        }).catch(error => {
            otwThis.hideLoadingView();
            otwThis.toastMsg(error.message || '获取数据异常');
        })
    }
    
    componentDidMount (){
        const { otwThis } = this.props;
        //服务费
        var nationalCodes = [this.props.order.DepartureCode,this.props.order.DestinationCode];
        let model={
           OrderCategory:7,
           MatchModel:{
               NationalCodes:JSON.stringify(nationalCodes) 
           }
       }
       CommonService.CurrentCustomerServiceFees(model).then(response => {
           if (response && response.success) {
               this.setState({
                   IsShowServiceFee:response.data.IsShowServiceFee
               })
           }
       }).catch(error => {
          
       })

        let melaModel = { 
            Key:"noChooseSeatAirlineConfig" 
        }
        CommonService.GetMelaData(melaModel).then(response => {
            if (response && response.success && response.data) {
                let cfg = response.data.noChooseSeatAirlineConfig ?? response.data.NoChooseSeatAirlineConfig ?? response.data;
                if (typeof cfg === 'string') {
                    try {
                        cfg = JSON.parse(cfg);
                    } catch (e) {
                        cfg = [];
                    }
                }
                this.setState({
                    noChooseSeatAirlineConfig: Array.isArray(cfg) ? cfg : [],
                })
            }
        }).catch(error => {
            otwThis && otwThis.toastMsg && otwThis.toastMsg(error.message);
        })
    }

    chooseSeat = () => {
        const { order } = this.props;
        const { noChooseSeatAirlineConfig } = this.state;
        NavigationUtils.push(this.props.navigation, 'FlightChooseSeatScreen', {order,from:'intlFlight',noChooseSeatAirlineConfig});
    }

    _renderOrder() {
        const { order,prompt,cancel } = this.props;
        const {IsShowServiceFee} = this.state;
        if (order.OrderType === 2) {
            order.OrderTypeDesc = '改签单';
        } else if (order.OrderType === 3) {
            order.OrderTypeDesc = '退票单';
        } else {
            order.OrderTypeDesc = '订票单';
        }
        const isShowBtn = order.Status === IntlFlightEnum.orderStatus.TicketIssued || order.Status === IntlFlightEnum.orderStatus.TicketRescheduled;
        let fromDateDesc, toDateDesc;
        if (order.DepartureTime) {
            let departureTime = Utils.Date.toDate(order.DepartureTime);
            if (departureTime) {
                fromDateDesc = departureTime.format('yyyy-MM-dd HH:mm');
            }
        }
        const departureTimeValue = Utils.Date.toDate(order.DepartureTime);
        const nowTime = new Date().getTime();
        const depTime = departureTimeValue && departureTimeValue.getTime ? departureTimeValue.getTime() : NaN;
        const isBeforeDeparture = isFinite(depTime) ? nowTime < depTime : true;
        const isShowPay = order.Status === IntlFlightEnum.orderStatus.WaitingPayment;
        const isCheckpeding = order.Status === IntlFlightEnum.orderStatus.Approving;
        let showBtn = this.props.userInfoId ===(order.CreateEmployee&&order.CreateEmployee.Id) ?true:false;
        return (
            <TouchableHighlight onPress={this._toDetail} underlayColor='transparent'>
                <View style={{ backgroundColor: '#fff', marginHorizontal: 10,borderRadius:6,marginTop:10,paddingHorizontal:20,paddingBottom:10}}>
                    <View style={{flexDirection:'row',justifyContent: "space-between",borderBottomWidth:1,borderColor:Theme.lineColor,paddingVertical:10}}>
                        <View style={{flexDirection:'row'}}>
                            <Image source={ require('../../res/Uimage/IntFlightFloder/intflight_lo.png')} style={{ width: 18, height: 18 }}></Image>
                            <CustomText style={{ color: Theme.commonFontColor,marginLeft:8 }} text={order.FeeType === 2 ? '因私出行' : '因公出行'} />
                        </View>
                        <CustomText style={{ color: Theme.theme }} text={order.StatusDesc} />
                    </View>
                    <View style={{ marginTop:6, flexDirection: 'row', justifyContent: 'space-between'}}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {/* <Text allowFontScaling={false} style={{ fontSize: 15,fontWeight:'bold',color:Theme.fontColor }}>{Utils.Parse.isChinese() ? order.Departure : order.DepartureEname}-{Utils.Parse.isChinese() ? order.Destination : order.DestinationEname}</Text> */}
                            <Text allowFontScaling={false} style={{ fontSize: 14,fontWeight:'bold',color:Theme.fontColor }}>{order.JourneyDesc ? order.JourneyDesc.replace(/[\r\n]+$/, '') : ''}</Text>
                        </View>
                        {
                            IsShowServiceFee ? (
                                <CustomText style={{ color: Theme.theme, fontSize: 17}} text={'¥' + ((order.Amount + order.ServiceCharge)?(order.Amount + order.ServiceCharge).toFixed(2):0)} />
                            ) : (
                                    <CustomText style={{ color: Theme.theme, fontSize: 17 }} text={'¥' + (order.Amount?order.Amount.toFixed(2):0)} />
                                )
                        }
                    </View>
                    <View style={{ marginTop: 6 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text allowFontScaling={false} numberOfLines={1} style={{ width: 200 , fontSize: 13, color: Theme.commonFontColor}}>{order.TravellerNames}</Text>
                            <CustomText style={{ color: Theme.commonFontColor, fontSize: 10, backgroundColor:Theme.greenBg,height:14,paddingHorizontal:5 ,borderRadius:2,color:Theme.theme }} text={order.OrderTypeDesc} />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <CustomText style={curStyle.aidFont} text={fromDateDesc} />
                            <CustomText style={[curStyle.aidFont,{marginLeft:10}]} text={order.JourneyTypeDesc} />
                        </View>
                        
                    </View>
                    {
                        !this.props.dontShow && showBtn ?
                        <View>
                        {
                        isCheckpeding && !order.MassOrderId ?
                                <View style={{ padding: 5, flexDirection: 'row-reverse',borderTopColor:Theme.lineColor, borderTopWidth:1 }}>
                                    <TouchableHighlight onPress={prompt} underlayColor='transparent' style={curStyle.btn}>
                                        <CustomText style={{ color: 'white' }} text='催审' />
                                    </TouchableHighlight>
                                </View> : null
                        }
                        {
                        order.Status === 15?//占座中
                            <View style={{ padding: 5, flexDirection: 'row-reverse' ,borderTopColor:Theme.lineColor, borderTopWidth:1}}>
                                <TouchableHighlight onPress={cancel} underlayColor='transparent' style={curStyle.btn}>
                                    <CustomText style={{ color: 'white' }} text='取消' />
                                </TouchableHighlight>
                            </View>:null 

                        }
                        {
                        isShowPay && (!order.MassOrderId || order.OrderType===2) ? (
                                <View style={{ padding: 5, flexDirection: 'row-reverse' ,borderTopColor:Theme.lineColor, borderTopWidth:1}}>
                                    <TouchableHighlight onPress={this._onPay} underlayColor='transparent' style={curStyle.btn}>
                                        <CustomText style={{ color: 'white' }} text='付款' />
                                    </TouchableHighlight>
                                    <TouchableHighlight onPress={cancel} underlayColor='transparent' style={curStyle.btn2}>
                                        <CustomText style={{ color: Theme.theme }} text='取消' />
                                    </TouchableHighlight>
                                </View>
                            ) : null
                        }
                        {
                            isShowBtn&&order.CanChangeInfoList&&order.CanChangeInfoList.length>0 ? (
                                <View style={{ padding: 5, flexDirection: 'row-reverse' ,borderTopColor:Theme.lineColor, borderTopWidth:1}}>
                                    {
                                        order.CanRefund?
                                        <TouchableHighlight onPress={this._onRefund} underlayColor='transparent' style={curStyle.btn2}>
                                           <CustomText style={{ color: Theme.theme }} text='退票' />
                                        </TouchableHighlight>
                                        :null
                                    }
                                    {
                                        order.CanReissue?
                                        <TouchableHighlight onPress={this._onReissue} underlayColor='transparent' style={curStyle.btn}>
                                            <CustomText style={{ color: 'white' }} text='改签' />
                                        </TouchableHighlight>
                                        :null
                                    }
                                </View>
                            ) : null
                        }
                        {
                            (order.Status===4 ||order.Status===9) && isBeforeDeparture && this._canChooseSeatByAirlines(order) && this._canChooseSeatByShareAirlineCode(order) ?
                            <View style={{ padding: 5, flexDirection: 'row-reverse' ,borderTopColor:Theme.lineColor, borderTopWidth:1}}>
                                <TouchableHighlight onPress={this.chooseSeat} underlayColor='transparent' style={curStyle.btn}>
                                    <CustomText style={{ color: 'white' }} text='选座' />
                                </TouchableHighlight>
                            </View>:null
                        }
                        
                        </View>
                        :null
                    }
                </View>
            </TouchableHighlight>
        );
    }
    render() {
        const { order } = this.props;
        if (!order) {
            return null;
        }
        return this._renderOrder();
    }
}
export default function(props) {
    const navigation = useNavigation();
    return (
        <OrderListItem {...props} navigation={navigation} />
    )
}

const curStyle = StyleSheet.create({
    aidFont: {
        marginTop: 5,
        fontSize: 13,
        color: Theme.commonFontColor
    },
    btn: {
        backgroundColor: Theme.theme,
        height: 22,
        marginLeft: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius:2,
        paddingHorizontal:15,
    },
    btn2: {
        height: 22,
        marginLeft: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal:15,
        borderWidth:1,
        borderColor:Theme.theme,
        borderRadius:2
    }
});
