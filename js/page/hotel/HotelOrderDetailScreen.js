import React from 'react';
import {
    View,
    Text,
    Platform,
    ScrollView,
    TouchableOpacity,
    DeviceEventEmitter,
    TouchableHighlight,
    ImageBackground,
    Modal,
    Image
} from 'react-native';
import SuperView from '../../super/SuperView';
import UserInfoDao from '../../service/UserInfoDao';
import CustomText from '../../custom/CustomText';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Theme from '../../res/styles/Theme';
import I18nUtil from '../../util/I18nUtil';
import Util from '../../util/Util';
import Ionicons from 'react-native-vector-icons/Ionicons';
import OrderDetailInfoView from '../common/OrderDetailInfoView';
import CustomeTextInput from '../../custom/CustomTextInput';
import Key from '../../res/styles/Key';
import ViewUtil from '../../util/ViewUtil';
import HotelService from '../../service/HotelService';
import CustomActionSheet from '../../custom/CustomActionSheet';
import NavigationUtils from '../../navigator/NavigationUtils';
import CommonService from '../../service/CommonService';
import { connect } from 'react-redux';
import BackPress from '../../common/BackPress';
import  LinearGradient from 'react-native-linear-gradient';
import TextViewTitle from '../../custom/TextViewTitle'
import HighLight from '../../custom/HighLight';

class HotelOrderDetailScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '订单详情',
            // hide:true,
            statusBar: {
                backgroundColor: Theme.theme,
            },
            style: {
                backgroundColor: Theme.theme,
            },
            titleStyle: {
                color: 'white'
            },
            leftButton2:true,
        }
        this._tabBarBottomView = {
            bottomInset: true
        }
        this.state = {
            customerInfo: null,
            order: null,
            isShowDetailPrice: true,
            comment: '',
            showPrice: true,
            options: ['行程改变', '无法满足需求', '酒店价格太贵', '其他途径预订', '其它'],
            IsShowServiceFee:true,
            PaymentInfo: {
                alipay: null,
                wechat: null
            },
            visible: false,
            showImageUrl: '',
        }
        this.backPress = new BackPress({ backPress: () => this._stopBackEvent() })
    }

    // 重置手势滑动
    static navigationOptions = ({ navigation }) => {
        return {
            gesturesEnabled: true
        }
    }

    _stopBackEvent = () => {
        this.pop();
        return true;
    }

    componentDidMount() {
        this.backPress.componentDidMount();
        this.showLoadingView();
        UserInfoDao.getCustomerInfo().then(response => {

            let promise = null;
            let model = {
                OrderId: this.params.OrderId
            }
            if (this.params.isApprove) {
                promise = HotelService.ApprovelOrderDetail(model);
            }else if (this.params.enterprise){
                promise = HotelService.EnterPrise_HotelOrder(model);
            }else {
                promise = HotelService.OrderDetail(model);
            }
            promise.then(orderDetail => {
                this.hideLoadingView();
                if (orderDetail && orderDetail.success) {
                    this.setState({
                        customerInfo: response,
                        order: orderDetail.data
                    },()=>{
                        //服务费
                        // let referencEmployeeId
                        // if(this.props.comp_userInfo&&this.props.comp_userInfo.employees){
                        //     let num = this.props.comp_userInfo&&this.props.comp_userInfo.employees.length-1
                        //     referencEmployeeId = this.props.comp_userInfo.employees[num].PassengerOrigin.EmployeeId
                        // }else{
                        //     referencEmployeeId = userInfo.Id
                        // }
                        let model={
                            OrderCategory:4,
                            MatchModel:{
                                IsAgreement:this.state.order.IsAgreement
                            },
                            // ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
                            // ReferencePassengerId:referencEmployeeId,
                        }
                        CommonService.CurrentCustomerServiceFees(model).then(response => {
                            if (response && response.success) {
                                this.setState({
                                    IsShowServiceFee:response.data.IsShowServiceFee
                                })
                            }
                        }).catch(error => {
                           
                        })
                    })
                } else {
                    this.toastMsg(orderDetail.message || '获取订单详情失败');
                }
            }).catch(error => {
                this.hideLoadingView();
                this.toastMsg(error.message || '获取订单详情失败');
            })
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
        UserInfoDao.getUserInfo().then(response => {
            this.setState({
                userInfo: response,
            })
        }).catch(error => {})
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.backPress.componentWillUnmount();
        this.listener && this.listener.remove();
    }

    /**
     *  同意
     * @param  order 
     */
    _agreeConfim = (order) => {
        this.showAlertView(
        () => {
            return (<View style={{ padding: 5, justifyContent: 'center', alignItems: 'center' }}>
                <CustomText text='请输入同意原因' />
                <CustomeTextInput onChangeText={text => this.setState({ comment: text })} multiline={true} style={{ height: 60, width: 250, marginTop: 10, borderWidth: 1, borderColor: Theme.lineColor }} />
            </View>)
        },
        () => {
            return ViewUtil.getAlertButton('我再想想', () => {
                this.dismissAlertView();
            }, '确定同意', () => {
                this.dismissAlertView();
                this._approve(order)
            })
        })
    }
    _approve = (order) => {
        const { comment } = this.state;
        let model = { OrderId: order.Id, Status: 1,Comment: comment, };
        this.showLoadingView();
        HotelService.Approvel(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                this.showAlertView('审批成功', () => {
                    return ViewUtil.getAlertButton('确定', () => {
                        this.dismissAlertView();
                        DeviceEventEmitter.emit(Key.ApprovalChange, order);
                        this.pop();
                    })
                })
            } else {
                this.toastMsg(response.message || '审批失败,请联系客服');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })

    }

    /**
     *  驳回
     */
    _rejectConfim = (order) => {
        this.showAlertView(() => {
            return (<View style={{ padding: 5, justifyContent: 'center', alignItems: 'center' }}>
                <HighLight name={'请输入驳回原因'} />
                <CustomeTextInput onChangeText={text => this.setState({ comment: text })} multiline={true} style={{ height: 60, width: 250, marginTop: 10, borderWidth: 1, borderColor: Theme.lineColor }} />
            </View>)
        }, () => {
            return ViewUtil.getAlertButton('我再想想', () => {
                this.dismissAlertView();
            }, '确定驳回', () => {
                this.dismissAlertView();
                this._reject(order);
            })
        })
    }
    _reject = (order) => {
        const { comment } = this.state;
        if (!comment) {
            this.toastMsg('驳回原因不能为空');
            return;
        }
        let model = {
            OrderId: order.Id,
            Comment: comment,
            Status: 2
        };
        this.showLoadingView();
        HotelService.Approvel(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                this.showAlertView('驳回成功', () => {
                    return ViewUtil.getAlertButton('确定', () => {
                        this.dismissAlertView();
                        DeviceEventEmitter.emit(Key.ApprovalChange, order);
                        this.pop();
                    })
                })
            } else {
                this.toastMsg(response.message || '驳回失败,请联系客服');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }

    _handlePress = (index) => {
        let reason = this.state.options[index];
        if (reason === '其它') {
            this.showAlertView(() => {
                return (<View style={{ padding: 5, justifyContent: 'center', alignItems: 'center' }}>
                    <CustomText text='请输入取消原因' />
                    <CustomeTextInput value={this.state.comment} onChangeText={text => this.setState({ comment: text })} multiline={true} style={{ height: 60, width: 250, marginTop: 10, borderWidth: 1, borderColor: Theme.lineColor }} />
                </View>)
            }, () => {
                return ViewUtil.getAlertButton('我再想想', () => {
                    this.dismissAlertView();
                }, '确定取消', () => {
                    this.dismissAlertView();
                    this._submitCancel(reason);
                })
            })
        } else {
            this._submitCancel(reason);
        }
    }

    _submitCancel = (reason) => {
        const { comment, order } = this.state;
        if (reason === '其它' && !comment) {
            this.toastMsg('请输入退订原因');
            return;
        }
        var model = {
            OrderId: this.params.OrderId,
            CancelCode: reason,
            Reason: comment,
            Platform: Platform.OS
        }
        let promise = null;
        if (order.Status === 4) {
            promise = HotelService.HotelOrderRefund2(model);
        } else {
            promise = HotelService.HotelOrderCancel(model);
        }
        this.showLoadingView();
        promise.then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if(order.Status === 4){
                    if(response.code==201){
                        CommonService.PaymentInfo({ SerialNumber: response.data.SerialNumber,Id:this.params.OrderId }).then(response => {
                            this.hideLoadingView();
                            if (response && response.success) {
                                this.setState({
                                    refundOrder: response.data,
                                },()=>{
                                    this.payTypeView.show();
                                })
                            } else {
                                this.toastMsg(response.message || '获取支付信息失败');
                            }
                        }).catch(error => {
                            this.hideLoadingView();
                            this.toastMsg(error.message || '获取数据异常');
                        }) 
                    }else{
                        this.showAlertView(response.message||'已提交退订', () => {
                            return ViewUtil.getAlertButton('确定', () => {
                                this.dismissAlertView();
                                NavigationUtils.popToTop(this.props.navigation);
                                DeviceEventEmitter.emit(Key.HotelOrderListChange, order);
                            })
                        })
                    }
                }else{
                    this.showAlertView(response.message||'订单取消成功', () => {
                        return ViewUtil.getAlertButton('确定', () => {
                            this.dismissAlertView();
                            NavigationUtils.popToTop(this.props.navigation);
                            DeviceEventEmitter.emit(Key.HotelOrderListChange, order);
                        })
                    })
                }

            } else {
                this.toastMsg(response.message || '操作失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '操作失败');
        })
    }

    showServiceInfo = () => {
        let message='';
        if (this.state.order && this.state.order.ServiceFees) {
            this.state.order.ServiceFees.forEach(obj => {
                message += (Util.Parse.isChinese() ? obj.FeeName : obj.FeeEnName) + '¥' + obj.Price + '\n';
            })
        }



        this.showAlertView(message);
    }
    /**
     * 价格信息
     */
    _priceInfo = (order) => {
        const { isShowDetailPrice, showPrice, IsShowServiceFee } = this.state;
        let hotelRefundAmout = 0;
        if (order.RefundInfoList) {
            order.RefundInfoList.forEach(item => {
                if (item.Status === 14) {
                    hotelRefundAmout = hotelRefundAmout + item.Amount;
                }
            })
        }
        let allAmount = order.Amount + (IsShowServiceFee?order.ServiceCharge:0)
        return (
            <View style={{ marginTop: 10,marginHorizontal:10, borderRadius:6,padding:10, backgroundColor: 'white'}}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomColor: Theme.lineColor, borderBottomWidth: 0.5 }}>
                    <View style={{ padding: 10, flexDirection: 'row', alignItems: 'center' }}>
                        <TextViewTitle title={'应付金额'} style={{marginLeft:-1,}} imgIcon={require('../../res/Uimage/shu.png')}/>
                        <CustomText text={"："} />
                        <CustomText text={'￥'+allAmount.toFixed(2) } style={{ color: Theme.fontColor,fontSize:14 }} />
                        {/* <Text style={{fontSize:12,color:Theme.specialColor}}>({I18nUtil.translate(order.SettleTypeDesc)})</Text> */}
                        {
                             order.RatePlan.ChannelTag ?
                             <View style={{ backgroundColor: Theme.redColor, alignItems: 'center', marginRight: 10,flexDirection:'row',borderRadius:2,paddingHorizontal:6 }}>
                                 <CustomText text={order.RatePlan.ChannelTag} style={{ color: 'white' }} />
                             </View>
                             : null
                        }
                    </View>
                    {/* <TouchableOpacity onPress={() => { this.setState({ showPrice: !this.state.showPrice }) }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <CustomText style={{ color: '#6DC17F', fontSize: 13 }} text={showPrice ? '收起详情' : '展开详情'} />
                            <Ionicons name={showPrice ? 'chevron-up' : 'chevron-down'} size={24} color={'#6DC17F'} style={{ marginRight: 5 }} />
                        </View>
                    </TouchableOpacity> */}
                </View>
                {
                   
                        <View style={{ backgroundColor: 'white', padding: 10 }}>
                            {
                                order.IsBeyondSelfPay?    
                                <View>    
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <CustomText style={{ color: Theme.aidFontColor, fontSize: 12 }} text='公司支付' />
                                        <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 12 }} text={'¥' + order.CompanyAmount} />
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <CustomText style={{ color: Theme.aidFontColor, fontSize: 12 }} text='个人支付' />
                                        <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 12 }} text={'¥' + order.PersonalAmount} />
                                    </View>
                                </View>:null
                            }
                            {
                                IsShowServiceFee?
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                     <View style={{
                                                flexDirection: 'row',
                                                alignItems: "center"
                                            }}>
                                                <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='服务费' />
                                                {
                                                    order.ServiceCharge > 0 ?
                                                        <AntDesign name={'questioncircle'} color={Theme.theme} size={18} style={{ marginHorizontal: 5 }} onPress={this.showServiceInfo} />
                                                        : null
                                                }
                                            </View>
                                    {/* <CustomText style={{ color: Theme.aidFontColor, fontSize: 12 }} text='服务费' /> */}
                                    <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'¥' + order.ServiceCharge} />
                                </View>:null
                            }
                                                      
                        </View>
                     
                }
                {
                    order.OrderType == 1 && order.RefundInfoList && order.RefundInfoList.length > 0 ?
                        <View style={{ marginBottom: 10,marginTop:10 }}>
                            <TouchableHighlight underlayColor='transparent' onPress={() => this.setState({ isShowDetailPrice: !this.state.isShowDetailPrice })}>
                                <View style={{ height: 40,borderRadius:6, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', justifyContent: 'space-between', borderBottomColor: Theme.lineColor, padding: 10, borderBottomWidth: 0.5 }}>
                                    <View style={{ flexDirection: "row", alignItems: 'center' }}>
                                        <CustomText text='退订总额:' />
                                        <Text style={{ color: Theme.theme, marginLeft: 5 }}>¥{hotelRefundAmout}</Text>
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: 'center', justifyContent: 'center' }}>
                                        <CustomText text={isShowDetailPrice ? '收起详情' : '展开详情'} style={{ color: Theme.theme }} />
                                        <Ionicons name={isShowDetailPrice ? 'chevron-up' : 'chevron-down'} size={24} color={'gray'} style={{ marginRight: 5 }} />
                                    </View>
                                </View>
                            </TouchableHighlight>
                            {
                                isShowDetailPrice ?
                                    this._renderRenduInfo(order)
                                    : null
                            }
                        </View>
                        : null
                }
                {
                    order.OrderType == 3 && order.RefundInfo ?
                        <View style={{ marginBottom: 10,marginTop:10 }}>
                            <TouchableHighlight underlayColor='transparent' onPress={() => this.setState({ isShowDetailPrice: !this.state.isShowDetailPrice })}>
                                <View style={{ height: 40,borderRadius:6, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', justifyContent: 'space-between', borderBottomColor: Theme.lineColor, padding: 10, borderBottomWidth: 0.5 }}>
                                    <View style={{ flexDirection: "row", alignItems: 'center' }}>
                                        <CustomText text='退订总额:' />
                                        <Text style={{ color: Theme.theme, marginLeft: 5 }}>¥{order.Amount}</Text>
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: 'center', justifyContent: 'center' }}>
                                        <CustomText text={isShowDetailPrice ? '收起详情' : '展开详情'} style={{ color: Theme.theme }} />
                                        <Ionicons name={isShowDetailPrice ? 'chevron-up' : 'chevron-down'} size={24} color={'gray'} style={{ marginRight: 5 }} />
                                    </View>
                                </View>
                            </TouchableHighlight>
                            {
                                isShowDetailPrice ?
                                    this._renderRenduInfo2(order.RefundInfo)
                                    : null
                            }
                        </View>
                        : null
                }
            </View>
        )
    }

    _renderRenduInfo = (result) => {
        if (!result.RefundInfoList || result.RefundInfoList.length === 0) return null;
        return result.RefundInfoList.map((item, index) => {
            let checkIn = Util.Date.toDate(item.CheckInDate);
            let checkOut = Util.Date.toDate(item.CheckOutDate);
            let roomInfo = typeof item.RefundRoomInfo === 'string' && JSON.parse(item.RefundRoomInfo);
            let RoomCount = item.RoomCount;
            let refunTime = Util.Date.toDate(item.CreateTime);
            let roomInfoStr = '';
            if (roomInfo) {
                roomInfo.forEach(item => {
                    roomInfoStr = roomInfoStr + ' ' + I18nUtil.translate('房间') + item.RoomNumber + ' ';
                    item.HotelRefundCustomers.forEach(cusotm => {
                        roomInfoStr = roomInfoStr + cusotm.Name + ' '
                    })
                })
            }
            return (
                <View key={index} style={{ padding: 10,backgroundColor:"#fff",borderRadius:6 }}>
                    <View style={{ flexDirection: 'row' }}>
                        <CustomText style={{ color: 'gray' }} text='退订日期：' />
                        <CustomText style={{ marginLeft: 10 ,color:Theme.specialColor}} text={(checkIn && checkIn.format('yyyy-MM-dd')) + '-——' + (checkOut && checkOut.format('yyyy-MM-dd'))} />
                    </View>
                    <View style={{ flexDirection: 'row', flex: 1 }}>
                        <CustomText style={{ color: 'gray' }} text='退订入住人：' />
                        <Text style={{ marginLeft: 10, flex: 1, color:Theme.specialColor}} numberOfLines={2}>{I18nUtil.translate('共')}{RoomCount}{I18nUtil.translate('间')} {roomInfoStr}</Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <CustomText style={{ color: 'gray' }} text='退订费' />
                        <CustomText style={{ color: 'gray' }} text='：' />
                        <Text style={{ marginLeft: 10, color: Theme.theme }}>¥{item.RefundAmount}</Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <CustomText style={{ color: 'gray' }} text='房费：' />
                        <Text style={{ marginLeft: 10, color: Theme.theme }}>¥{item.Amount}</Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <CustomText style={{ color: 'gray' }} text='提交时间：' />
                        <Text style={{ marginLeft: 10,color:Theme.specialColor }}>{refunTime && refunTime.format('yyyy-MM-dd HH:mm')}</Text>
                    </View>
                </View>
            )
        })
    }

    _renderRenduInfo2 = (item) => {
            let checkIn = Util.Date.toDate(item.CheckInDate);
            let checkOut = Util.Date.toDate(item.CheckOutDate);
            let roomInfo = typeof item.RefundRoomInfo === 'string' && JSON.parse(item.RefundRoomInfo);
            let RoomCount = item.RoomCount;
            let refunTime = Util.Date.toDate(item.CreateTime);
            let roomInfoStr = '';
            if (roomInfo) {
                roomInfo.forEach(item => {
                    roomInfoStr = roomInfoStr + ' ' + I18nUtil.translate('房间') + item.RoomNumber + ' ';
                    item.HotelRefundCustomers.forEach(cusotm => {
                        roomInfoStr = roomInfoStr + cusotm.Name + ' '
                    })
                })
            }
            return (
                <View style={{ padding: 10,backgroundColor:"#fff",borderRadius:6 }}>
                    <View style={{ flexDirection: 'row' }}>
                        <CustomText style={{ color: 'gray' }} text='退订日期：' />
                        <CustomText style={{ marginLeft: 10 ,color:Theme.specialColor}} text={(checkIn && checkIn.format('yyyy-MM-dd')) + '——' + (checkOut && checkOut.format('yyyy-MM-dd'))} />
                    </View>
                    <View style={{ flexDirection: 'row', flex: 1 }}>
                        <CustomText style={{ color: 'gray' }} text='退订入住人：' />
                        <Text style={{ marginLeft: 10, flex: 1, color:Theme.specialColor}} numberOfLines={2}>{I18nUtil.translate('共')}{RoomCount}{I18nUtil.translate('间')} {roomInfoStr}</Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <CustomText style={{ color: 'gray' }} text='退订费' />
                        <CustomText style={{ color: 'gray' }} text='：' />
                        <Text style={{ marginLeft: 10, color: Theme.theme }}>¥{item.RefundAmount}</Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <CustomText style={{ color: 'gray' }} text='房费：' />
                        <Text style={{ marginLeft: 10, color: Theme.theme }}>¥{item.Amount}</Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <CustomText style={{ color: 'gray' }} text='提交时间：' />
                        <Text style={{ marginLeft: 10,color:Theme.specialColor }}>{refunTime && refunTime.format('yyyy-MM-dd HH:mm')}</Text>
                    </View>
                </View>
            )
    }
    /**
     * 订单信息
     */
    _orderInfo(order) {
        let Comment = null;
        if (order.ApprovedList && Array.isArray(order.ApprovedList) && order.ApprovedList.length > 0) {
            Comment = order.ApprovedList.find(item => {
                return item.StatusDesc === '不同意';
            })
        }
        let ReferenceEmployee
        let employeess = [];
        order.Customers.map((item)=>{
            if(item.ReferId == order.ReferenceEmployeeId){
                ReferenceEmployee = item.Name
            }
            employeess.push(item.Name);
        })
        let employStr = employeess.join('、')
        let ExcessStr1 = Util.Parse.isChinese()?
                        `酒店参考差标：CNY${order.ExcessAmount}/每晚；参考差规人：${employStr}`:
                        `Hotel Rate Cap Reference：CNY${order.ExcessAmount}/per Night；Reference：${employStr}`
        let ExcessStr2 = Util.Parse.isChinese()?
                        `酒店参考差标：CNY${order.ExcessAmount}/每晚；参考差规人：${ReferenceEmployee}`:
                        `Hotel Rate Cap Reference：CNY${order.ExcessAmount}/per Night；Reference：${ReferenceEmployee}`
        return (
            <View style={{ backgroundColor: 'white',marginTop:15,borderTopWidth:1, borderColor:Theme.lineColor,paddingTop:10 }}>
                {
                    order.CancelInfo ? (
                        <Text style={{ flexDirection: 'row', alignItems: 'center',marginTop:5 }}>
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 12 }} text='取消原因' />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 12 }} text='：' />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 12, flex: 1 }} numberOfLines={1} text={order.CancelInfo.ReasonCode} />
                        </Text>
                    ) : null
                }

                {
                    Comment ? (
                        <Text style={{ flexDirection: 'row', alignItems: 'center',marginTop:5 }}>
                            <AntDesign name={'infocirlce'} size={14} color={Theme.theme} style={{ marginRight: 2 }} />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 12 }} text='驳回原因' />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 12 }} text='：' />
                            <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 12, flex: 1 }} numberOfLines={1} text={Comment.Comment} />
                        </Text>
                    ) : null
                }
                {
                    order.OrderHotelReasons&&order.OrderHotelReasons.map((item)=>{
                        return(
                            < Text style={{ flexDirection: 'row', flex: 1, alignItems: 'center',marginTop:5}}>
                                <AntDesign name={'infocirlce'} size={14} color={Theme.theme} style={{ marginRight: 2 }} />
                                <CustomText style={{ color: Theme.specialColor2, fontSize: 12 }} text='违反差旅规则原因' />
                                <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 12, flex: 1 }} numberOfLines={1} text={'('+item.RuleTypeDesc+')'+(Util.Parse.isChinese()? item.Reason:item.ReasonEn?item.ReasonEn:'')} />
                            </Text> 
                        )
                    })
                }
                {
                    this.params.isApprove?//审批页详情展示
                        order.ExcessAmount>0?
                            order.ShareRoomApplyFlag?
                            <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center',marginTop:5}}>
                                <Text style={{ flex: 1 }}>{ExcessStr1}</Text>
                            </View>
                            :
                            <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center',marginTop:5}}>
                                <Text style={{ flex: 1 }}>{ExcessStr2}</Text>
                            </View> 
                        :null 
                    :null
                }
            </View>
        );
    }

    /**
    * 乘客信息
    */
    _travellerInfo(order) {
        if (!order.Customers || order.Customers.length == 0) {
            return null;//
        }
        return (
            <View style={{ backgroundColor: 'white', marginHorizontal:10 ,borderRadius:6,marginTop:10}}>
                <View style={{ flexDirection: 'row', paddingHorizontal: 20,marginTop:20}}>
                    <View style={{}}>
                       <TextViewTitle title={'入住人'} style={{marginLeft:-1,marginTop:-10}} imgIcon={require('../../res/Uimage/shu.png')}/>
                    </View>
                    
                    <View style={{marginLeft:20}}>
                    {order.Customers.map((item)=>{
                        return(
                        <View style={{  }}>
                            <CustomText style={{ color: Theme.annotatedFontColor ,marginBottom:5}} text={item.Name} />
                            {item.CheckInCertificate? <CustomText style={{ color: Theme.annotatedFontColor ,marginBottom:5}} text={'身份证：'+Util.Read.simpleReplace(item.CheckInCertificate)} />:null}
                            {
                                item.Addition&&item.Addition.DictItemList&&item.Addition.DictItemList.map((items)=>{
                                    let item_name = items.ItemName?items.ItemName:null
                                    let item_EnName = items.ItemEnName?items.ItemEnName:null
                                    return(
                                        items.ShowInOrder?
                                        <View style={{flexDirection:'row', flexWrap:'wrap', flex: 1}}>
                                            <CustomText style={{ color: Theme.annotatedFontColor,}} text={Util.Parse.isChinese()? items.DictName:items.DictEnName?items.DictEnName:items.DictName} />
                                            <CustomText style={{ color: Theme.annotatedFontColor,  }} text={'：'} /> 
                                            <CustomText style={{ color: Theme.annotatedFontColor }} text={Util.Parse.isChinese()?item_name:item_EnName?item_EnName:item_name} /> 
                                        </View>
                                        :null  
                                    )
                                })
                            }
                        </View>)
                    })}
                    {
                        order.Addition&&order.Addition.DictItemList.map((item)=>{
                                return(
                                    <View style={{flexDirection:'row'}}>
                                    <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={item.DictName} />
                                    <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={'：'+item.ItemName} /> 
                                    </View>
                                )
                            })
                    }
                    </View>
                </View>
                {
                    order.Contact && (order.Contact.Name || order.Contact.Email || order.Contact.Mobile) ? (
                        <View style={{ flexDirection: 'row',borderTopWidth:1,borderColor:Theme.lineColor, margin: 20 }}>
                            <View style={{  }}>
                                <TextViewTitle title={'联系人'} style={{marginLeft:-1,marginTop:10}} imgIcon={require('../../res/Uimage/shu.png')}/>
                            </View>
                            <View style={{ marginLeft:20,marginTop:15 }}>
                                {/* <View style={{flexDirection:'row'}}> 
                                    <CustomText style={{ color: Theme.annotatedFontColor }} text={'姓名'} />
                                    <CustomText style={{ color: Theme.annotatedFontColor }} text={':'} />
                                    <CustomText style={{ color: Theme.annotatedFontColor, marginLeft:7 }} text={order.Contact.Name} />
                                </View> */}
                                <View style={{flexDirection:'row'}}>
                                    <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={'邮箱'} />
                                    <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={':'} />
                                    {order.Contact.Email?
                                        <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 ,marginLeft:7, width:220}} text={order.Contact.Email} />
                                        :null
                                    }                                
                                </View>
                                <View style={{flexDirection:'row'}}>
                                    <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={'电话'} />
                                    <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={':'} />
                                    <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5, marginLeft:7 }} text={order?.Contact?.Mobile?.replace(/(\d{3})(\d{4})(\d{4})/,"$1****$3")} />
                                </View>
                            </View>
                        </View>
                    ) : null
                }
            </View>
        );
    }

    /**
     *  渲染审批按钮
     */
    _renderApproveBtn = (order) => {
        const { userInfo } = this.state
        let showApproveBtn = false
        order?.ApproveEmployee?.map((item) => {
            if (item.Id === userInfo?.Id) {
                showApproveBtn = true
            }
        })
        if (this.params.isApprove && order.Status === 18 && showApproveBtn) {
            return (
                <View style={{}}>
                    {
                        ViewUtil.getTwoBottomBtn('驳回',this._rejectConfim.bind(this, order),'同意',this._agreeConfim.bind(this, order))
                    }
                    {/* <TouchableHighlight style={[{ flex: 1, backgroundColor: Theme.theme, margin: 10, borderRadius: 2 }, { alignItems: 'center', justifyContent: 'center' }]} onPress={this._agreeConfim.bind(this, order)} underlayColor='transparent'>
                        <CustomText style={{ color: 'white' }} text='同意' />
                    </TouchableHighlight>
                    <TouchableHighlight style={[{ flex: 1, backgroundColor: Theme.specialColor2, margin: 10, borderRadius: 2 }, { alignItems: 'center', justifyContent: 'center' }]} onPress={this._rejectConfim.bind(this, order)} underlayColor='transparent'>
                        <CustomText style={{ color: 'white' }} text='驳回' />
                    </TouchableHighlight> */}
                </View>
            )
        }
    }

    _renderHeader = (result) => {
        /**
        * 判断有无早餐
        */
        let haveBreackFast = '';
        if (result.RatePlan && result.RatePlan.Breakfast == 0) {
            haveBreackFast = I18nUtil.translate('无早');
        } else {
            haveBreackFast = result.RatePlan.Breakfast? I18nUtil.translate('早餐') + 'X' + result.RatePlan.Breakfast : '' 
        }
        let checkInDate = Util.Date.toDate(result.CheckInDate);

        let checkOutDate = Util.Date.toDate(result.CheckOutDate);
        //取消政策
        let cancleRuleS = result.RatePlan.PolicyDesc ? result.RatePlan.PolicyDesc : '';

        return (
            <View style={{backgroundColor:'#fff',marginHorizontal:10,borderRadius:6,paddingHorizontal:20,paddingVertical:20 }}>
                <CustomText style={{  fontSize:15, fontWeight:'bold'}} numberOfLines={1} text={result.Hotel.Name} />
                <CustomText style={{  fontSize:12,marginTop:5,color:Theme.assistFontColor}} text={result.Hotel.Address} />
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginVertical:10}}>
                    <View style={{alignItems:'flex-start'}}>
                       <CustomText text={checkInDate.format('MM-dd')} style={{fontSize:24,fontWeight:"bold"}}></CustomText>
                       <Text style={{fontSize:12,color:Theme.commonFontColor}}>{I18nUtil.translate('入住')}</Text>
                    </View>
                    <View style={{borderBottomWidth:1,width:60,alignItems:'center',height:20,borderColor:Theme.assistFontColor}}>
                        <Text style={{ fontSize:12,color:Theme.commonFontColor }}>{I18nUtil.translate('共')} {result.NightCount} {I18nUtil.translate('晚')}</Text>
                    </View>
                    <View style={{alignItems:'flex-end'}}>
                       <CustomText text={checkOutDate.format('MM-dd')} style={{fontSize:24,fontWeight:"bold"}}></CustomText>
                       <Text style={{fontSize:12,color:Theme.commonFontColor}}>{I18nUtil.translate('离店')}</Text>
                    </View>
                </View>
                <Text allowFontScaling={false} style={{ fontSize: 13 ,color:Theme.fontColor,fontWeight:'bold',marginBottom:5}}>{result.Room.RoomName + ' ' + (result.Room.BedType ? result.Room.BedType : '') + ' ' + haveBreackFast}</Text>
                <Text>
                    <Text allowFontScaling={false} style={{marginTop: 2, fontSize: 12,color:Theme.commonFontColor }}>{ I18nUtil.translate('描述:')}</Text>
                    <Text allowFontScaling={false} style={{marginTop: 2, fontSize: 12,color:Theme.commonFontColor }}>{result.Room.Description}</Text>
                </Text>
                {/* <Text allowFontScaling={false} style={{marginTop: 8, fontSize: 13,fontWeight:'bold',color:Theme.fontColor }}>{I18nUtil.translate('取消规则')}</Text> */}
                {/* <TitleView2 title={'取消规则'}  style={{}}></TitleView2> */}
                <TextViewTitle title={'取消规则'} style={{marginLeft:-1,}} imgIcon={require('../../res/Uimage/shu.png')}/>
                <Text allowFontScaling={false} style={{marginTop: 2, fontSize: 12,color:Theme.commonFontColor }}>{I18nUtil.translate(cancleRuleS)}</Text>
                { this._orderInfo(result)}
            </View>
        )

    }
    _renderCancelBtn = (order) => {
        const {customerInfo} = this.state;
        if (this.params.isApprove) return;
        let massage = "取消酒店订单将扣除全部或部分房费，最终以与酒店确认的金额为准。请留意关注您所预定酒店的取消条款。";
        if ((order.Status === 4 || order.Status === 17 || order.Status === 1)&& order.CanRefund) {
            return ViewUtil.getSubmitButton('取消订单', () => {
                this.showAlertView(massage, () => {
                    return ViewUtil.getAlertButton('取消', () => {
                        this.dismissAlertView();
                    }, '确定', () => {
                        this.dismissAlertView();
                        this.actionSheet.show();
                    })
                })
            })
        }
        return null;
    }
    renderBody() {
        const { order, customerInfo, options, refundOrder, PaymentInfo } = this.state;
        if (!order) return;
        return (
            <View style={{flex:1}}>
            <LinearGradient start={{x: 1, y: 0}} end={{x: 1, y: 0.5}} style={{flex:1}} colors={[Theme.theme,Theme.normalBg]}>
                {/* <View style={{flexDirection:'row',paddingHorizontal:15,justifyContent:'space-between',height:44,alignItems:'center'}}>
                    <TouchableOpacity onPress={()=>{this.pop()}}>
                        <AntDesign name={'arrowleft'} size={20} color={'#fff'} />
                    </TouchableOpacity>
                    <CustomText style={{fontSize:16, color:'#fff'}} text={'订单详情'}></CustomText>
                    <CustomText style={{fontSize:16, color:'#fff'}} text={''}></CustomText>
                </View> */}
                <CustomText style={{ color:'#fff', fontSize: 24, paddingHorizontal:20 }} text={I18nUtil.translate(order.StatusDesc)} />
                <CustomText style={{ color:'#fff', fontSize: 12, paddingHorizontal:20, marginTop:5,marginBottom:20}} text={`${I18nUtil.translate('订单号')}：${order.SerialNumber}`} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps='handled'>
                {this._renderHeader(order)}
                {/* {this._orderInfo(order)} */}
                {this._travellerInfo(order)}
                <View style={{marginBottom:-10}}>
                {this._priceInfo(order)}
                </View>
                <OrderDetailInfoView order={order} otwThis={this} customerInfo={customerInfo} showImage={(url) => {
                    this.setState({
                        showImageUrl: url,
                        visible: true
                    })
                }} />
                {this._renderShowBigImage()}
                <CustomActionSheet ref={o => this.actionSheet = o} options={options} onPress={this._handlePress} />
                {refundOrder?<PayTypeView ref={o => this.payTypeView = o} PaymentInfo={PaymentInfo} order={refundOrder} otwTHis={this} from={'hotel'} />:null}
            </ScrollView>
            </LinearGradient>
               {this._renderApproveBtn(order)}
               {this.params.enterprise?null:
                this._renderCancelBtn(order)
               }
               {
                order.Status === 3 && order.Guarantee.NeedGuaranteeValidation?
                ViewUtil.getSubmitButton('填写担保验证码', () => {
                    this.push('HotelGuranteeMessageVertify',{OrderId:order.Id,CreditCard : null,});
                })
                :null
               }

            </View>
           
        )
    }

    _renderShowBigImage = () => {
        return (
            <Modal transparent visible={this.state.visible}>
                <TouchableHighlight style={{ flex: 1 }} underlayColor='transparent' onPress={() => {
                    this.setState({
                        visible: false,
                        showImageUrl: ''
                    })
                }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: "center", justifyContent: 'center' }}>
                        <Image style={{ width: screenWidth-20, height: screenHeight-20, resizeMode:'contain' }}  source={{ uri: this.state.showImageUrl }} />
                    </View>
                </TouchableHighlight>
            </Modal>
        )
    }
}
const getStatePorps = state => ({
    comp_userInfo: state.comp_userInfo,
})
export default connect(getStatePorps)(HotelOrderDetailScreen);