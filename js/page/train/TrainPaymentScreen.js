import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableHighlight,
    ScrollView,
    InteractionManager,
    DeviceEventEmitter
} from 'react-native';
import SuperView from '../../super/SuperView';
import ViewUtil from '../../util/ViewUtil';
import NavigationUtils from '../../navigator/NavigationUtils';
import BackPress from '../../common/BackPress';
import Util from '../../util/Util';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import I18nUtil from '../../util/I18nUtil';
import AntDesign from 'react-native-vector-icons/AntDesign';
import CommonService from '../../service/CommonService';
import UserInfoDao from '../../service/UserInfoDao';
import PayTypeView from '../common/PayTypeView';
import PayInfoView from './PayInfoView';
import CommonEnum from '../../enum/CommonEnum';
import { connect } from 'react-redux';
class TrainPaymentScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '信息核实'
        }
        this._tabBarBottomView = {
            bottomInset: true,
        }
        this.backPress = new BackPress({ backPress: () => this._backBtnClick() })
        this.state = {
            order: null,
            customerInfo: null,
            PaymentInfo: {
                alipay: null,
                wechat: null,
            }
        }
    }

    // 重置手势滑动
    static navigationOptions = ({ navigation }) => {
        return {
            gesturesEnabled: false
        }
    }


    /**
     *  返回按钮
     */
    _backBtnClick = () => {
        const { fromId } = this.params;
        if (fromId === 'newNoticeCenter') {
            this.pop()
        }else{
            this.showAlertView('您还未完成订单支付，如现在退出，可稍后进入【支付列表】页完成支付。确认退出吗', () => {
                return ViewUtil.getAlertButton('退出', () => {
                    this.dismissAlertView();
                    NavigationUtils.popToTop(this.props.navigation);
                    InteractionManager.runAfterInteractions(() => {
                        DeviceEventEmitter.emit('deleteApply', {});
                    });
                }, '继续支付', () => {
                    this.dismissAlertView();
                })
            })
            return true;
        }
    }
    componentDidMount() {
        this.backPress.componentDidMount();
        model = {
            SerialNumber: this.params.SerialNumber,
        }
        this.showLoadingView();
        UserInfoDao.getCustomerInfo().then(customerInfo => {
            CommonService.PaymentInfo(model).then(response => {
                this.hideLoadingView();
                if (response && response.success) {
                    this.setState({
                        order: response.data,
                        customerInfo: customerInfo
                    })
                } else {
                    this.toastMsg(response.message || '获取支付信息失败');
                }
            }).catch(error => {
                this.hideLoadingView();
                this.toastMsg(error.message || '获取数据异常');
            })
        }).catch(error => {
            this.hideLoadingView();
        })

    }
    componentWillUnmount() {
        super.componentWillUnmount();
        this.backPress.componentWillUnmount();
    }
    /**
     *  稍后支付
     */
    _laterPay = () => {
        this._backBtnClick();
    }
    /**
     *  取消订单
     */
    _cancelBtn = () => {
        this.showAlertView('确定要取消订单吗？', () => {
            return ViewUtil.getAlertButton('我再想想', () => {
                this.dismissAlertView();
            }, '确定', () => {
                this.dismissAlertView();
                this.showLoadingView();
                let model = {
                    SerialNumber: this.state.order.SerialNumber
                }
                CommonService.PaymentCancel(model).then(response => {
                    this.hideLoadingView();
                    if (response && response.success) {
                        this.showAlertView('取消订单成功', () => {
                            return ViewUtil.getAlertButton('确定', () => {
                                this.dismissAlertView();
                                NavigationUtils.popToTop(this.props.navigation);
                            })
                        })
                    } else {
                        this.toastMsg(response.message || '取消订单失败');
                    }
                }).catch(error => {
                    this.hideLoadingView();
                    this.toastMsg(error.message || '取消订单异常');
                })
            })
        })
    }
    _showDetail = (title, data) => {
        this.payInfoView.show(title, data);
    }
    /**
     *  直接支付
     */
    _toPay = () => {
        const { customerInfo ,order} = this.state;
        if(!order){ return; }
        if (order.SettleType === CommonEnum.PaymnetSettleType.Prestored) {
            this.showLoadingView();
            CommonService.PaymentWallet(this.params).then(response => {
                this.hideLoadingView();
                if (response && response.success) {
                    this.showAlertView('订单支付成功,您可去我的订单中查看', () => {
                        return ViewUtil.getAlertButton('取消', () => {
                            this.dismissAlertView();
                            NavigationUtils.popToTop(this.props.navigation);
                        }, '确定', () => {
                            this.dismissAlertView();
                            this.push('TrainOrderListScreen');
                        })
                    })
                } else {
                    this.toastMsg(response.message || '支付失败');
                }
            }).catch(error => {
                this.hideLoadingView();
                this.toastMsg(error.message || '操作失败');
            })


            return;
        }

        this.payTypeView.show();
    }
    renderBody() {
        const { order, customerInfo, PaymentInfo } = this.state;
        if (!order) return null;
        let paymentLimit = Util.Date.toDate(order.PaymentLimit);
        let airTrip = null;
        if (order.Addition && order.Addition.OrderList && order.Addition.OrderList.length > 0) {
            airTrip = order.Addition.OrderList[0] && order.Addition.OrderList[0].TrainInfo;
            airTrip.DepartureTime = Util.Date.toDate(airTrip.DepartureTime);

        }else if(order.Addition&& order.Addition.TrainInfo){
            airTrip = order.Addition.TrainInfo;
            airTrip.DepartureTime = Util.Date.toDate(airTrip.DepartureTime);
        }
        return (
            <View style={{flex:1}}>
            <ScrollView keyboardShouldPersistTaps='handled'>
                <PayInfoView ref={o => this.payInfoView = o} />
                <View style={{paddingHorizontal: 10 ,paddingTop:10,backgroundColor:Theme.yellowBg }}>
                    {
                        Util.Parse.isChinese() ?
                            <Text style={{ lineHeight:23,color:Theme.commonFontColor,fontSize:13 }}>预订成功,请在<Text style={{ color: Theme.theme }}>{paymentLimit.format('HH:mm')}</Text> 前完成支付,逾期自动取消预订,以免售完或价格变化,给您的出行带来不便</Text> :
                            <Text>Please finish payment before <Text style={{ color: Theme.theme }}>{paymentLimit.format('HH:mm')}</Text> Overdue payment will lead to cancellation of booking and passengers need to rebook again.</Text>
                    }
                </View>
                {airTrip?
                    <View style={{marginHorizontal:10,marginTop:10,padding:10, backgroundColor: 'white',borderRadius:6}}>
                        <View style={styles.row}>
                            <CustomText  style={{fontSize:14,color:Theme.fontColor}}  text={I18nUtil.translate(airTrip.FromStationName) + '-' + I18nUtil.translate(airTrip.ToStationName)} />
                        </View>
                        <TouchableHighlight underlayColor='transparent' onPress={this._showDetail.bind(this, '列车详情', airTrip)}>
                            <View style={styles.row}>
                                <CustomText  style={{fontSize:14,color:Theme.commonFontColor}}  text={airTrip.DepartureTime.format('yyyy年MM月dd日 HH:mm') + airTrip.DepartureTime.getWeek()} />
                                <AntDesign name={'infocirlceo'} size={18} color={Theme.theme} />
                            </View>
                        </TouchableHighlight>
                        <TouchableHighlight underlayColor='transparent' onPress={this._showDetail.bind(this, '乘客信息',order.Addition&&order.Addition.OrderList?order.Addition.OrderList: order.Addition.OrderPassenger)}>
                            <View style={styles.row}>
                                <CustomText  style={{fontSize:14,color:Theme.commonFontColor}}  text='人员信息' />
                                <AntDesign name={'infocirlceo'} size={18} color={Theme.theme} />
                            </View>
                        </TouchableHighlight>
                    </View>
                :null
                }
                <View style={{marginHorizontal:10,marginTop:10,padding:10, backgroundColor: 'white',borderRadius:6}}>
                <View style={styles.row}>
                    <CustomText  style={{fontSize:14,color:Theme.commonFontColor}}  text='还需支付' />
                    <CustomText text={'¥' + order.Amount} style={{ color: Theme.theme,fontSize:14 }} />
                </View>
                <View style={styles.row}>
                    <CustomText  style={{fontSize:14,color:Theme.commonFontColor}}  text='支付方式' />
                    <CustomText style={{fontSize:14,color:Theme.fontColor}}  text={order.SettleType === CommonEnum.PaymnetSettleType.Prestored?'钱包支付':(order.SettleType === CommonEnum.PaymnetSettleType.Credit?'企业月结':'在线支付')} />
                </View>
                </View>
                {/* <View style={{ marginVertical: 25, justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableHighlight underlayColor='transparent' onPress={this._cancelBtn}>
                        <View style={styles.cancelBtn}>
                            <CustomText text='取消订单' />
                        </View>
                    </TouchableHighlight>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'center', height: 40 }}>
                    <TouchableHighlight underlayColor='transparent' onPress={this._laterPay} style={{ flex: 1, marginHorizontal: 20 }}>
                        <View style={[styles.payBtn, { backgroundColor: Theme.theme }]}>
                            <CustomText style={{ color: 'white' }} text='稍后支付' />
                        </View>
                    </TouchableHighlight>
                    <TouchableHighlight style={{ flex: 1, marginHorizontal: 20 }} underlayColor='transparent' onPress={this._toPay.bind(this)}>
                        <View style={[styles.payBtn, { backgroundColor: Theme.theme }]}>
                            <CustomText style={{ color: 'white' }} text='直接支付' />
                        </View>
                    </TouchableHighlight>
                </View> */}
                <PayTypeView ref={o => this.payTypeView = o} PaymentInfo={PaymentInfo} order={order} otwTHis={this} from={'train'} />
            </ScrollView>
            {
                ViewUtil.getTwoBottomBtn('取消订单',this._cancelBtn,'直接支付',this._toPay)
            }
            </View>
        )
    }
}
const getState = state => ({
    feeType: state.feeType.feeType
})
export default connect(getState)(TrainPaymentScreen)
const styles = StyleSheet.create({
    row: {
        paddingHorizontal: 10,
        height: 44,
        flexDirection: "row",
        alignItems: 'center',
        justifyContent: "space-between",
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 0.5,
        backgroundColor: 'white',
        // marginTop: 10
    },
    cancelBtn: {
        backgroundColor: "white",
        borderColor: Theme.lineColor,
        borderWidth: 0.5,
        justifyContent: "center",
        alignItems: "center",
        width: 200,
        height: 40,
    },
    payBtn: {
        height: 40,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center'
    }
})