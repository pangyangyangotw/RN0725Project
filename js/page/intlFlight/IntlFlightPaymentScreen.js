import React from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableHighlight,
    InteractionManager,
    DeviceEventEmitter
} from 'react-native';
import SuperView from '../../super/SuperView';
import NavigationUtils from '../../navigator/NavigationUtils';
import BackPress from '../../common/BackPress';
import Util from '../../util/Util';
import CommonService from '../../service/CommonService';
import Theme from '../../res/styles/Theme';
import ViewUtil from '../../util/ViewUtil';
import Alipay from '@0x5e/react-native-alipay';
import UserInfoDao from '../../service/UserInfoDao';
import CommonEnum from '../../enum/CommonEnum';
import { connect } from 'react-redux';
import CustomText from '../../custom/CustomText';
import PayTypeView from '../common/PayTypeView';

class IntlFlightPaymentScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '支付中心'
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
                wechat: null
            }
        }
    }

    // 重置手势滑动
    static navigationOptions = ({ navigation }) => {
        return {
            gesturesEnabled: false
        }
    }

    componentWillUnmount() {
        wechat.removeAllListeners();
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
        this.showLoadingView();
        UserInfoDao.getCustomerInfo().then(customerInfo => {
            CommonService.PaymentInfo(this.params).then(response => {
                this.hideLoadingView();
                if (response && response.success) {
                    this.setState({
                        customerInfo,
                        order: response.data,
                    })
                } else {
                    this.toastMsg(response.message || '获取支付信息失败');
                }
            }).catch(error => {
                this.hideLoadingView();
                this.toastMsg(error.message || '获取数据异常');
            })
        }).catch(error => {

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
    pay = (type) => {
        const { PaymentInfo } = this.state;
        if (type === PayType.alipay) {
            if (PaymentInfo.alipay) {
                this.payWithAlipay(PaymentInfo.alipay);
            } else {
                this._loadPaymentInfo(type);
            }
        } else if(type === PayType.yeepay){
            this._loadPaymentInfo(type);
        }
        else {
            if (PaymentInfo.wechat) {
                let obj = {
                    partnerId: PaymentInfo.wechat.PartnerId,
                    prepayId: PaymentInfo.wechat.PrepayId,
                    nonceStr: PaymentInfo.wechat.NonceStr,
                    timeStamp: PaymentInfo.wechat.Timestamp,
                    package: PaymentInfo.wechat.Package,
                    sign: PaymentInfo.wechat.Sign
                }
                wechat.isWXAppInstalled().then(isInstall => {
                    if (isInstall) {
                        try {
                            wechat.pay(obj);
                        } catch (e) {
                        }
                        wechat.addListener('PayReq.Resp', (response) => {
                            if (parseInt(response.errCode) === 0) {
                                this.showAlertView('订单支付成功,您可去我的订单中查看', () => {
                                    return ViewUtil.getAlertButton('取消', () => {
                                        this.dismissAlertView();
                                        NavigationUtils.popToTop(this.props.navigation);
                                    }, '确定', () => {
                                        this.dismissAlertView();
                                        this.push('IntlFlightOrderList');
                                    })
                                })
                            } else {
                                this.toastMsg(response.errStr || '支付失败，请重新进行支付');
                            }
                        })
                    } else {
                        this.toastMsg('没有安装微信，请您安装微信之后再试')
                    }
                }).catch(error => {
                    this.toastMsg('打开微信异常');
                })
            } else {
                this._loadPaymentInfo(type);
            }
        }
    }
    async payWithAlipay(AppPayload) {
        try {
            let response = await Alipay.pay(AppPayload);
            if (response.resultStatus === '6001') {
                this.toastMsg('用户中途取消');
            } else if (response.resultStatus === '4000') {
                this.toastMsg('操作失败');
            } else if (response.resultStatus === '6002') {
                this.toastMsg('网络连接出错');
            } else if (response.resultStatus === '5000') {
                this.toastMsg('重复请求');
            } else if (response.resultStatus === '9000') {
                this.showAlertView('订单支付成功,您可去我的订单中查看', () => {
                    return ViewUtil.getAlertButton('取消', () => {
                        this.dismissAlertView();
                        NavigationUtils.popToTop(this.props.navigation);
                    }, '确定', () => {
                        this.dismissAlertView();
                        this.push('IntlFlightOrderList');
                    })
                })
            }
        } catch (error) {
            if (error.message === '4000:系统繁忙，请稍后再试') {
                this.toastMsg('请安装支付宝客户端进行支付');
                return;
            }
            this.toastMsg(error.message || '订单支付失败，请重新进行支付');
        }
    }

    _loadPaymentInfo = (type) => {
        const { order, PaymentInfo } = this.state;
        let model = {
            SerialNumber: order.SerialNumber,
            PaymentType: type,
            TradeType: 'APP'
        }
        this.showLoadingView('订单确认中');
        CommonService.paymenPayload(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if (type === PayType.alipay) {
                    PaymentInfo.alipay = response.data.Payload;
                }else if(type === PayType.yeepay){
                    PaymentInfo.yeepay = response.data.Payload;
                    this.push('Web', {
                        title: '易宝支付',
                        url: response.data.Payload
                    });
                } else {
                    PaymentInfo.wechat = response.data;
                }
                this.setState({

                }, () => {
                    // this.pay(type);
                })
            } else {
                this.toastMsg(response.message || '获取支付数据失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取支付数据失败');
        })

    }

    // 钱包支付
    _walletPay = () => {
        this.showLoadingView();
        const { order } = this.state;
        let model = {
            SerialNumber: order.SerialNumber
        }
        CommonService.PaymentWallet(order).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                this.showAlertView('订单支付成功,您可去我的订单中查看', () => {
                    return ViewUtil.getAlertButton('取消', () => {
                        this.dismissAlertView();
                        NavigationUtils.popToTop(this.props.navigation);
                    }, '确定', () => {
                        this.dismissAlertView();
                        this.push('IntlFlightOrderList');
                    })
                })
            } else {
                this.toastMsg(response.message || '支付失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '操作失败');
        })
    }

    /**
     *  直接支付
     */
    _toPay = () => {
        const { order } = this.state;
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
                            this.push('FlightOrderList');
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

    /**
     *  稍后支付
     */
    _laterPay = () => {
        this._backBtnClick();
    }

    renderBody() {
        const { order, customerInfo, PaymentInfo } = this.state;
        if (!order) return null;

        let limitDate = Util.Date.toDate(order.PaymentLimit)


        return (
            <View style={{flex:1}}>
            <View style={{flex:1}}>
                <View style={{ backgroundColor: "white", margin: 10, padding: 10, borderRadius:6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: "space-between",marginHorizontal:10 }}>
                        <Text style={{ fontSize: 13, color: Theme.commonFontColor }}>交易状态</Text>
                        <Text style={{ fontSize: 13,color: Theme.fontColor  }}>{order ? order.PaymentStatusDesc : ''}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: "space-between",marginTop: 10,marginHorizontal:10 }}>
                        <Text style={{ fontSize: 13, color: Theme.commonFontColor }}>商品名称</Text>
                        <Text style={{ fontSize: 13,color: Theme.fontColor  }}>{order.Subject}</Text>
                    </View>
                </View>
                <View style={{marginHorizontal:10,padding:10, backgroundColor: 'white',borderRadius:6}}>
                <Text style={{ margin: 10, fontSize: 13,color: Theme.fontColor }}>请在<Text style={{ color: Theme.theme }}>{limitDate ? limitDate.format('yyyy-MM-dd HH:mm:ss') : ''}</Text>之前完成支付</Text>
                <View style={{ backgroundColor: "white",  padding: 10,flexDirection:'row',justifyContent:'space-between',alignItems:'center' }}>
                    <Text style={{ fontSize: 13, color: Theme.commonFontColor  }}>支付金额</Text>
                    <Text style={{ fontSize: 13, color: Theme.theme, marginTop: 10 }}>¥{order.Amount}元</Text>
                </View>
                <View style={{ backgroundColor: "white", padding: 10,flexDirection:'row',justifyContent:'space-between',alignItems:'center' }}>
                    <Text style={{ fontSize: 13 , color: Theme.commonFontColor }}>支付方式</Text>
                    <Text style={{ fontSize: 13, color: Theme.fontColor }}>{order.SettleType === CommonEnum.PaymnetSettleType.Prestored?'钱包支付':(order.SettleType === CommonEnum.PaymnetSettleType.Cash?'在线支付':'企业月结')}</Text>
                </View>
                </View>
                {/* <View style={{ flexDirection: 'row', justifyContent: 'center', height: 40 }}>
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
                <PayTypeView ref={o => this.payTypeView = o} PaymentInfo={PaymentInfo} order={order} otwTHis={this} from={'intlFlight'} />
            </View>
                {
                ViewUtil.getTwoBottomBtn('稍后支付',this._laterPay,'直接支付',this._toPay)
                }
            </View>
        )
    }
}
const getState = state => ({
    feeType: state.feeType.feeType
})

export default connect()(IntlFlightPaymentScreen)

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
        marginTop: 10
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
const PayType = {
    wechat: 'WxPay',
    alipay: 'Alipay',
    yeepay: 'Yeepay',
}