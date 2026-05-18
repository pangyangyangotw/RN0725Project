import React from 'react';
import {
    View,
    StyleSheet,
    TouchableHighlight,
    Image,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Theme from '../../res/styles/Theme';
import CropImage from '../../custom/CropImage';
import Utils from '../../util/Util';
import FlightEnum from '../../enum/FlightEnum';
import CustomText from '../../custom/CustomText';
import I18nUtil from '../../util/I18nUtil';
import Util from '../../util/Util';
import FlightService from '../../service/FlightService';
import PropTypes from 'prop-types';
import { useNavigation } from '@react-navigation/native';
import NavigationUtils from '../../navigator/NavigationUtils';
import CommonService from '../../service/CommonService';
import ViewUtil from '../../util/ViewUtil';

class OrderListItem extends React.PureComponent {

    static propTypes = {
        order: PropTypes.object.isRequired,
        otwThis: PropTypes.object,
    }
    constructor(props) {
        super(props);
        this.state = {
            showServiceCharge:true,
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

        const airlines = Array.isArray(o.Airlines) ? o.Airlines : [];
        if (airlines.length > 0) {
            return airlines.some((it) => {
                const code = it && (it.Code || it.code || it.Airline || it.airline || it.AirlineCode || it.airlineCode);
                const v = String(code || '').trim().toUpperCase();
                if (!v) return true;
                return !blockedSet.has(v);
            });
        }

        const singleCode = String(o.Airline || o.AirlineCode || o.Code || '').trim().toUpperCase();
        if (!singleCode) return true;
        return !blockedSet.has(singleCode);
    }

    _canChooseSeatByShareAirline = (order) => {
        const o = order || {};
        const blockedSet = this._getNoChooseSeatSet();
        if (!blockedSet || blockedSet.size === 0) return true;
        const share = String(o.ShareAirline || '').trim().toUpperCase();
        if (!share) return true;
        return !blockedSet.has(share);
    }
    componentDidMount = () => {
        const { otwThis } = this.props;
        let model = {
            OrderCategory: 1,//国内飞机
            MatchModel: null,
        }
        CommonService.CurrentCustomerServiceFees(model).then(response => {
            if (response && response.success && response.data) {
                this.setState({
                    showServiceCharge: response.data.IsShowServiceFee
                })
            }else{
                otwThis && otwThis.toastMsg && otwThis.toastMsg('获取数据异常');
            }
        }).catch(error => {
            otwThis && otwThis.toastMsg && otwThis.toastMsg(error.message);
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
    /**
     *  前往订单详情页
     */
    _toDetailAction = () => {
        NavigationUtils.push(this.props.navigation, 'FlightOrderDetail', {
            Id: this.props.order.Id,
            userInfoId:this.props.userInfoId
        })
    }
    _getOrderTypeDes(type) {
        let desc = '';
        switch (type) {
            case FlightEnum.OrderType.Issued:
                desc = '订票单';
                break;
            case FlightEnum.OrderType.Reissue:
                desc = '改签单';
                break;
            case FlightEnum.OrderType.Refund:
                desc = '退票单';
                break;
        }
        return desc;
    }
    /**
     *  退票
     */
    _refundAction = () => {

        NavigationUtils.push(this.props.navigation, 'FlightOrderRefund', {
            Id: this.props.order.Id
        });
    }

    //国内机票校验是否值机
    _ValidateTicket = (marginNum) => {
        const { otwThis, order } = this.props;
        let model = {
            OrderId: order.Id,
            Type:marginNum //2改期 3退票
        }
        otwThis.showLoadingView();
        FlightService.FltOrderValidateTicketStatus(model).then(response => {
            otwThis.hideLoadingView();
            if (response && response.success) {
               if(marginNum===2){
                 this._resheduleAction()
               }else if(marginNum===3){
                 this._refundAction()
               }
            } else {
                otwThis.toastMsg(response.message);
            }
        }).catch(error => {
            otwThis.hideLoadingView();
            if(marginNum===2){
               this._resheduleAction()
            }else if(marginNum===3){
               this._refundAction()
            }
            // otwThis.toastMsg(error.message || '数据异常');
        })  
    }

    _cancel=()=>{
        const { otwThis } = this.props;
        otwThis.showAlertView('确认取消订单?', () => {
            return ViewUtil.getAlertButton('取消', () => {
                otwThis.dismissAlertView();
            }, '确定', () => {
                otwThis.dismissAlertView();
                this._cancelBtn()
            })
        })
    }
    /**
     *  取消
     */
    _cancelBtn = () => {
        const { otwThis, order } = this.props;
        let model = {
            OrderId: order.Id
        }
        otwThis.showLoadingView();
        FlightService.orderCancel(model).then(response => {
            otwThis.hideLoadingView();
            if (response && response.success) {
                order.Status = FlightEnum.OrderStatus.Canceled;
                order.StatusDesc = '已取消';
                this.setState({});
                otwThis.toastMsg('取消订单成功');
            } else {
                otwThis.toastMsg(response.message || "取消订单失败");
            }
        }).catch(error => {
            otwThis.hideLoadingView();
            otwThis.toastMsg(error.message || '取消订单异常');
        })
    }
    /**
     *  催审
     */
    _remindBtn = () => {
        const { otwThis, order } = this.props;
        let model = {
            OrderId: order.Id
        }
        otwThis.showLoadingView();
        FlightService.orderRemind(model).then(response => {
            otwThis.hideLoadingView();
            if (response && response.success) {
                otwThis.toastMsg('催审订单成功');
            } else {
                otwThis.toastMsg(response.message || '催审订单失败');
            }
        }).catch(error => {
            otwThis.hideLoadingView();
            otwThis.toastMsg(error.message || '催审订单异常');
        })
    }
    /**
     *  改签
     */
    _resheduleAction = () => {
        FlightService.orderDetail(this.props.order.Id).then(orderDetail => {
            if (orderDetail && orderDetail.success) {
                NavigationUtils.push(this.props.navigation, 'FlightChangeSearch', {order:this.props.order, oldOrderDetail:orderDetail.data});
            } else {
                this.toastMsg(orderDetail.message || '获取信息异常');
            }
        }).catch(error => {
            this.toastMsg(error.message || '获取信息异常');
        })    
    }

    _waitforPayAction = () => {
        const { otwThis, order } = this.props;
        otwThis.showLoadingView();
        CommonService.FlightOrderApiPay({OrderId:order.Id}).then(response => {
            otwThis.hideLoadingView();
            if (response && response.success && response.data) {
                this.getPayMess(response.data)
            } else {
                otwThis.toastMsg(response.message || '获取支付信息失败');
            }
        }).catch(error => {
            otwThis.hideLoadingView();
            otwThis.toastMsg(error.message || '获取数据异常');
        })
    }

    getPayMess=(obj)=>{
        const { otwThis } = this.props;
        otwThis.showLoadingView();
        CommonService.PaymentInfo({SerialNumber:obj.payment.SerialNumber}).then(response => {
            otwThis.hideLoadingView();
            if (response && response.success) {
                NavigationUtils.push(this.props.navigation, 'FlightPayment', {SerialNumber:obj.payment.SerialNumber,from:'FlightOrderList'});
            } else {
                otwThis.toastMsg(response.message || '获取支付信息失败');
            }
        }).catch(error => {
            otwThis.hideLoadingView();
            otwThis.toastMsg(error.message || '获取数据异常');
        })
    }

    chooseSeat = () => {
        const { order } = this.props;
        const { noChooseSeatAirlineConfig } = this.state;
        NavigationUtils.push(this.props.navigation, 'FlightChooseSeatScreen', {order,from:'flight',noChooseSeatAirlineConfig});
    }
    
    render() {
        const { order } = this.props;
        const { showServiceCharge } = this.state;
        if (!order) return;
        order.DepartureTime = Util.Date.toDate(order.DepartureTime);
        order.DestinationTime = Util.Date.toDate(order.DestinationTime);
        const nowTime = new Date().getTime();
        const depTime = order.DepartureTime && order.DepartureTime.getTime ? order.DepartureTime.getTime() : NaN;
        const isBeforeDeparture = isFinite(depTime) ? nowTime < depTime : true;
        let showBtn = this.props.userInfoId ===order.CreateEmployeeId ?true:false;
        return (
            <TouchableHighlight underlayColor='transparent' onPress={this._toDetailAction} style={{ backgroundColor: 'white', marginHorizontal:10,paddingHorizontal: 20 ,borderRadius:6,marginTop:10}}>
                <View style={{ flex: 1 }}>
                    <View style={{flexDirection:'row',justifyContent: "space-between",borderBottomWidth:1,borderColor:Theme.lineColor,paddingVertical:10}}>
                        <View style={{flexDirection:'row'}}>
                            <Image source={ require('../../res/Uimage/flightFloder/flight_lo.png')} style={{ width: 18, height: 18 }}></Image>
                            <CustomText style={{ color: Theme.commonFontColor,marginLeft:8 }} text={order.FeeType === 2 ? '因私出行' : '因公出行'} />
                        </View>
                        <CustomText style={{ color: Theme.theme }} text={order.StatusDesc} />
                    </View>
                    <View style={[{ flexDirection: 'row' }]}>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between',marginTop:6 }}>
                                <View style={{ flexDirection: 'row' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <CustomText style={{ fontSize: 15,fontWeight:'bold' }} text={I18nUtil.translate(order.Departure) + '-' + I18nUtil.translate(order.Destination)} />
                                    </View>
                                    {
                                        order.SupplierType === FlightEnum.SupplierType.gw51Book ? (
                                            <View style={{ flexDirection: "row", marginLeft: 10 ,alignItems:'center'}}>
                                                <View style={{ height: 15, alignItems: 'center', backgroundColor: Theme.orangeColor, justifyContent: "center", paddingHorizontal:5,paddingVertical:1,borderRadius:2 }}>
                                                    <CustomText style={{ color: "white", fontSize: 10 }} text='渠道价' />
                                                    </View>
                                            </View>
                                        ) : null
                                    }
                                </View>
                                <View>
                                    {
                                        showServiceCharge ? (
                                            <CustomText style={{ color: Theme.theme, fontSize: 17 }} text={'¥' + ((order.Amount + order.ServiceCharge)?(order.Amount + order.ServiceCharge).toFixed(2):0)} />
                                        ) : (
                                                <CustomText style={{ color: Theme.theme, fontSize: 17 }} text={'¥' + (order.Amount?order.Amount.toFixed(2):0)} />
                                            )
                                    }
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                                <CustomText style={{  }} text={order.TravellerName} />
                                <CustomText style={{ color: Theme.commonFontColor, fontSize: 10, backgroundColor:Theme.greenBg,height:14,paddingHorizontal:5 ,borderRadius:2,color:Theme.theme}} text={this._getOrderTypeDes(order.OrderType)} />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                                <CustomText style={{ color: Theme.commonFontColor }} text={(order.DepartureTime && order.DepartureTime.format('yyyy-MM-dd HH:mm')) + I18nUtil.translate('-') + (order.DestinationTime && order.DestinationTime.format('HH:mm'))} />
                            </View>
                            <View style={{ flexDirection: 'row', marginTop: 6, marginBottom: 5 }}>
                                <CropImage code={order.Airline} />
                                <CustomText style={{ color: Theme.commonFontColor}} text={(Utils.Parse.isChinese() ? order.AirlineName : order.AirlineNameEn) + ' ' + order.Airline + order.AirNumber +'  '} />
                                <CustomText style={{ color: Theme.commonFontColor }} text={(Utils.Parse.isChinese() ? order.AirPlaceName :order.EnAirPlaceName)+order.AirPlace} />
                            </View>
                        </View>
                    </View>
                    {
                        !this.props.dontShow  && showBtn &&
                        <View style={{ flexDirection: 'row-reverse', marginTop: 10, alignItems:'center',borderTopWidth:1 ,borderColor:Theme.lineColor}}>
                            {
                                order.Status === FlightEnum.OrderStatus.TicketIssued && isBeforeDeparture && this._canChooseSeatByAirlines(order) && this._canChooseSeatByShareAirline(order) && order.SupplierType === 1 && order.IsTestOrder ==false ?
                                <View style={{paddingVertical:10, flexDirection:'row'}}>
                                    <TouchableHighlight underlayColor='transparent' style={styles.btn} onPress={this.chooseSeat}>
                                        <CustomText style={{ color: 'white' }} text='选座' />
                                    </TouchableHighlight>
                                </View>
                                :null
                            }
                            {
                                order.Status === FlightEnum.OrderStatus.TicketIssued && order.CanRefund ?
                                    <View style={{paddingVertical:10}}>
                                        <TouchableHighlight underlayColor='transparent' style={styles.btn2} onPress={()=>{this._ValidateTicket(3)}}>
                                            <CustomText style={{ color: Theme.theme}} text={Util.Parse.isChinese()?'退票':'Cancel Flight'} />
                                        </TouchableHighlight>
                                    </View>
                                    : null
                            }
                            {
                                order.Status === FlightEnum.OrderStatus.TicketIssued && order.CanReissue ?
                                    <View style={{paddingVertical:10}}>
                                        <TouchableHighlight underlayColor='transparent' style={styles.btn} onPress={()=>{this._ValidateTicket(2)}}>
                                            <CustomText style={{ color: '#fff' }} text='改签' />
                                        </TouchableHighlight>
                                    </View>
                                    : null
                            }
                            {
                                order.Status === FlightEnum.OrderStatus.Approving && !order.MassOrderId ?
                                    <View style={{paddingVertical:10}}>
                                        <TouchableHighlight underlayColor='transparent' style={styles.btn2} onPress={this._remindBtn}>
                                            <CustomText style={{ color: Theme.theme }} text='催审' />
                                        </TouchableHighlight>
                                    </View>
                                    : null
                            }
                            {
                                (order.Status === 12 && (!order.MassOrderId || order.OrderType===2))  ?
                                    <View style={{paddingVertical:10, flexDirection:'row'}}>
                                        <TouchableHighlight underlayColor='transparent' style={styles.btn2} onPress={this._cancel}>
                                            <CustomText style={{color: Theme.theme }} text={Util.Parse.isChinese?'取消':'Withdraw'} />
                                        </TouchableHighlight>
                                        <TouchableHighlight underlayColor='transparent' style={styles.btn} onPress={this._waitforPayAction}>
                                            <CustomText style={{ color: 'white' }} text='付款' />
                                        </TouchableHighlight>
                                    </View>
                                    : null
                            }
                            
                        </View>
                    }
                </View>
            </TouchableHighlight>
        )
    }
}
export default function(props) {
    const navigation = useNavigation();
    return (
        <OrderListItem {...props} navigation={navigation} />
    )
}
const styles = StyleSheet.create({
    btn: {
        backgroundColor: Theme.theme,
        height: 22,
        marginLeft: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius:2,
        paddingHorizontal:5,       
    },
    btn2: {
        height: 22,
        marginLeft: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal:5,
        borderWidth:1,
        borderColor:Theme.theme,
        borderRadius:2       
    }
})
