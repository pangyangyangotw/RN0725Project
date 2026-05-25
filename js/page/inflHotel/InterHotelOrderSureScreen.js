import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableHighlight,
    TouchableOpacity,
    DeviceEventEmitter,
    InteractionManager
} from 'react-native';
import SuperView from '../../super/SuperView';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import OrderSureBottom from '../common/OrderSureBottom';
import PassengerSureView from '../common/PassengerSureView';
import { connect } from 'react-redux';
import FlightService from '../../service/FlightService';
import Util from '../../util/Util';
import ViewUtil from '../../util/ViewUtil';
import NavigationUtils from '../../navigator/NavigationUtils';
import I18nUtil from '../../util/I18nUtil';
import BackPress from '../../common/BackPress';
import HotelService from '../../service/HotelService';
import HeaderView from '../hotel/HeaderView';
import CommonEnum from '../../enum/CommonEnum';
import CommonService from '../../service/CommonService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ComprehensiveService from '../../service/ComprehensiveService';
import Touchable from '../../util/TouchableUtil';
import AntDesign from 'react-native-vector-icons/AntDesign';
import  LinearGradient from 'react-native-linear-gradient';
import {TitleView2} from '../../custom/HighLight';

class InterHotelOrderSureScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this.requestModel = Util.Encryption.clone(this.params.requestModel);
        this._navigationHeaderView = {
            title: '订单确认',
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
            bottomInset: true,
            bottomColor: 'white'
        }
        this.state = {
            isStop: false,
            haveRead: false
        }
        this.backPress = new BackPress({ backPress: () => this._stopBackEvent() })
    }

    // 重置手势滑动
    static navigationOptions = ({ navigation }) => {
        return {
            gesturesEnabled: false
        }
    }

    _stopBackEvent = () => {
        if (!this.state.isStop) {
            this.pop();
        }
        return true;
    }

    componentDidMount() {
        this.backPress.componentDidMount();
    }
    componentWillUnmount() {
        super.componentWillUnmount();
        this.backPress.componentWillUnmount();
    }

    _orderBtnClick = () => {
        if (!this.state.haveRead) {
            this.toastMsg('请确保已阅读温馨提示');
            return;
        }
        this.requestModel?.Customers?.map(item=>{
            item.FirstName = String(item?.GivenName ?? '').trim().slice(0, 20);
            item.LastName = String(item?.Surname ?? '').trim().slice(0, 20);
        })
        this.showLoadingView();
        HotelService.getHotelOrderCreate(this.requestModel).then(response => {
            this.hideLoadingView();
            if (response && response.success && response.data) {
                if (response.code === '201') {
                    this.push('HotelPayment', { SerialNumber: response.data.Payment.SerialNumber ? response.data.Payment.SerialNumber : '',from:'inthotel' });
                    return;
                }         
                if (response.data.Guarantee && response.data.Amount > 0) {
                    // this.push('InterHotelGuarantee', { OrderId: response.data.Id });
                    let OtherBookingId;
                    if (response.data.Customers && response.data.Customers.length == 1 
                        && (response.data.Customers[0].PassengerOrigin && 
                            response.data.Customers[0].PassengerOrigin.EmployeeId != this.params.userInfo.Id)) {
                        OtherBookingId = response.data.Customers[0].PassengerOrigin && response.data.Customers[0].PassengerOrigin.EmployeeId
                    }
                    this.push('HotelGuarantee2', { 
                        OrderId: response.data.Id, 
                        isIntl:true,
                        OtherBookingId: OtherBookingId,
                        callBack:(item)=>{
                            this.setState({
                                isStop:item
                            })
                        }
                    });
                } else {
                    this.setState({
                        isStop: true
                    }, () => {
                        this.showAlertView('订单生成成功，您可去我的订单中查看', () => {
                            return ViewUtil.getAlertButton('取消', () => {
                                this.dismissAlertView();
                                NavigationUtils.popToTop(this.props.navigation);
                                InteractionManager.runAfterInteractions(() => {
                                    DeviceEventEmitter.emit('deleteApply', {});
                                });
                            }, '确定', () => {
                                this.push('InterHotelOrderListScreen');
                                this.dismissAlertView();
                            })
                        })
                    })
                }
            } else {
                if (response.code == 5) {
                    this.showAlertView(response.message, () => {
                        return ViewUtil.getAlertButton('取消', () => {
                            this.requestModel.IgnoreConfirm = 0;
                            this.dismissAlertView();
                            this.pop();
                        }, '确定', () => {
                            this.requestModel.IgnoreConfirm = 1;
                            this.dismissAlertView();
                            this._orderBtnClick();
                        })
                    })
                }else if(response.code =='NeedCreditCard'){
                    //compOrder:1 标识单元订单
                    let OtherBookingId;
                    if (response.data.Customers && response.data.Customers.length == 1 
                        && (response.data.Customers[0].PassengerOrigin && 
                            response.data.Customers[0].PassengerOrigin.EmployeeId != this.params.userInfo.Id)) {
                        OtherBookingId = response.data.Customers[0].PassengerOrigin && response.data.Customers[0].PassengerOrigin.EmployeeId
                    }
                    this.push('HotelGuarantee2', { 
                        compRequestModle:this.requestModel, 
                        compOrder:1, 
                        Guarantee:response.data.Guarantee, 
                        RatePlan:response.data.RatePlan,
                        OtherBookingId: OtherBookingId,
                        callBack:(item)=>{
                            this.setState({
                                isStop:item
                            })
                        }
                     });
                }else if(response.code =='NeedHotelGuarantee'){
                    //compOrder:1 标识单元订单
                    let OtherBookingId;
                    if (response.data.Customers && response.data.Customers.length == 1 
                        && (response.data.Customers[0].PassengerOrigin && 
                            response.data.Customers[0].PassengerOrigin.EmployeeId != this.params.userInfo.Id)) {
                        OtherBookingId = response.data.Customers[0].PassengerOrigin && response.data.Customers[0].PassengerOrigin.EmployeeId
                    }
                    this.push('HotelGuarantee2', { 
                        compRequestModle:this.requestModel, 
                        compOrder:1, 
                        Guarantee:response.data.Guarantee, 
                        RatePlan:response.data.RatePlan,
                        OtherBookingId: OtherBookingId,
                        callBack:(item)=>{
                            this.setState({
                                isStop:item
                            })
                        }
                     });
                } else {
                    this.showAlertView(response.message || '提交订单失败出错,请重试!', () => {
                        return ViewUtil.getAlertButton('确定', () => {
                            this.dismissAlertView();
                            this.requestModel.IgnoreConfirm = 0;
                            this.pop();
                        })
                    })
                }
            }
        }).catch(error => {
            this.hideLoadingView();
            this.requestModel.IgnoreConfirm = 0;
            this.toastMsg(error.message || '提交订单失败出错,请重试!');
        })
    }
    _comp_orderBtnClick=()=>{
        if (!this.state.haveRead) {
            this.toastMsg('请确保已阅读温馨提示');
            return;
        }
       const {comp_userInfo,comp_travelers} = this.props
       let Reference_employeeId = (comp_userInfo&&comp_userInfo.ReferenceEmployeeId)?(comp_userInfo&&comp_userInfo.ReferenceEmployeeId):(comp_travelers&&comp_travelers.travellers&&comp_travelers.travellers.ReferenceEmployeeId)?comp_travelers.travellers.ReferenceEmployeeId:null
       let model={
            MassOrderId:null,
            Category:6,//港澳台及国际酒店
            ReferenceEmployeeId:Reference_employeeId,//差旅规则及审批规则的参照员工ID。如果没有综合订单ID，且有多个出差员工时这个字段必填！（出差员工+当前预订人中的任意一人）
            ProjectId:comp_userInfo&&comp_userInfo.ProjectId,
            Travellers:this.params.Travellers
        }
       this.showLoadingView();
       ComprehensiveService.MassOrderCheckTravellers(model).then(response => {
        this.hideLoadingView();
            if (response?.success && response.data) {
                response.data.Travellers.forEach((item, index) => {
                    const traveller = this.params.Travellers[index] || {};
                    item.Certificates = Array.isArray(traveller.Certificates) ? traveller.Certificates : null;
                    item.Certificate = item.Certificates ? item.Certificates[0] : null;
                    item.Addition = traveller.Addition || null;
                });
                this._reloadProjectList(response.data);
            }else{
                this.hideLoadingView();
                this.toastMsg(response.message);
            }
        }).catch(error => {
                this.hideLoadingView();
                this.toastMsg(error.message);
        })
    }
    _reloadProjectList = (data) => {
        const { compMassOrderId,comp_userInfo,comp_travelers,compCreate_bool,apply } = this.props;
        const { AttachmentModel } = this.params;
        if(!data){return}
        let journeyid = 0;
        if(apply){
            if(apply.TravelApplyMode==1 && apply.JourneyList && apply.JourneyList.length>0){
                //行程模式
                journeyid = apply.selectApplyItem&&apply.selectApplyItem.Id
            }else{
                //目的地模式
                journeyid = apply.Id
            }
        }
        let Reference_employeeId = (comp_userInfo&&comp_userInfo.ReferenceEmployeeId)?(comp_userInfo&&comp_userInfo.ReferenceEmployeeId):(comp_travelers&&comp_travelers.ReferenceEmployeeId)?comp_travelers.ReferenceEmployeeId:null
        let model = {
            MassOrderId:compMassOrderId, //compMassOrderId ,综合订单id，有就传值，没有就不传
            RulesTravelId:null,//差旅规则id  data.RulesTravelId
            Approval:compCreate_bool?data.Approval:comp_travelers.Approval,
            ProjectId: comp_userInfo&&comp_userInfo.ProjectId,//项目id
            Platform: Platform.OS,
            Travellers: data.Travellers,//出差人列表
            DomesticFlights:[],//国内机票航班列表
            IntlFlight:null,//国际机票行程信息
            Hotel: this.requestModel,//国内酒店信息（包含房型）
            ForeignHotel: null,//国际酒店信息（包含房型）
            Train: null,//火车票车次信息（包含坐席）
            ReferenceEmployeeId:Reference_employeeId,//差旅规则及审批规则的参照员工ID。如果没有综合订单ID，且有多个出差员工时这个字段必填！（出差员工+当前预订人中的任意一人）
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
            IsClearCardTraveller:false,
            ApplyId:apply&&apply.Id,
            Attachment:AttachmentModel,
            JourneyId:journeyid
        }
        let OtherBookingId;
        if (data.Travellers && data.Travellers?.length == 1 && (data.Travellers?.[0]?.PassengerOrigin?.EmployeeId != this.props.comp_userInfo?.userInfo?.Id)) {
            OtherBookingId = data.Travellers?.[0]?.PassengerOrigin?.EmployeeId
        }
        let bookStr = Util.Parse.isChinese() ? '提交订单' : 'Confirm booking'
        this.showLoadingView()
        ComprehensiveService.MassOrderCreate(model).then(response => {
            this.hideLoadingView(); 
            if (response && response.success) {
                if (response.data) {
                    this.showAlertView(response.message || '订单尚未完成，请点击“提交订单”进入下一步。如本酒店行程要求信用卡担保，请注意查收系统发出的担保邮件及短信，并根据指引完成担保。', () => {
                        return ViewUtil.getAlertButton(bookStr, () => {
                            this.dismissAlertView();
                            DeviceEventEmitter.emit('freshCompDetail', {orderId:response.data.Id, isStop:true});
                            this.push('CompDetailScreen',{orderId:response.data.Id, isStop:true});
                        })
                    })
                }
           }else{
            if (response.code == 5) {
                this.showAlertView(response.message, () => {
                    return ViewUtil.getAlertButton('取消', () => {
                        this.requestModel.IgnoreConfirm = 0;
                        this.dismissAlertView();
                        this.pop();
                    }, '确定', () => {
                        this.requestModel.IgnoreConfirm = 1;
                        this.dismissAlertView();
                        this._comp_orderBtnClick();
                    })
                })
            } else if(response.code =='NeedHotelGuarantee'){
                this.push('HotelGuarantee2', { 
                    compRequestModle:model, 
                    Guarantee:response.data.HotelOrderCreateModel.Order.Guarantee, 
                    RatePlan:response.data.HotelOrderCreateModel.RatePlan,
                    OtherBookingId: OtherBookingId,
                    callBack:(item)=>{
                        this.setState({
                            isStop:item
                        })
                    }
                 });
            } else if(response.code == 'NeedCreditCard'){//Amadeus 需要用信用卡的情况
                this.push('HotelGuarantee2', { 
                    compRequestModle:model, 
                    Guarantee:response.data.HotelOrderCreateModel.Order.Guarantee, 
                    RatePlan:response.data.HotelOrderCreateModel.RatePlan,
                    OtherBookingId: OtherBookingId,
                    callBack:(item)=>{
                        this.setState({
                            isStop:item
                        })
                    }
                 });
            }
            else {
                this.showAlertView(response.message || '提交订单失败出错,请重试!', () => {
                    return ViewUtil.getAlertButton('确定', () => {
                        this.dismissAlertView();
                        this.requestModel.IgnoreConfirm = 0;
                        this.pop();
                    })
                })
            }
           }
        }).catch(error => {
            this.hideLoadingView()
            this.toastMsg(error.message || '加载数据失败请重试');
        })
    }
    _renderBottomView = () => {
        const{compSwitch} = this.props;
        const {totalPrice} = this.params;
        // let totalPrice = this.params.roomModel.AvgPrice * this.params.liveDay * this.params.roomCount;
        return (
            <View style={{ height: 50, flexDirection: 'row', backgroundColor: 'white', alignItems: 'center' }}>
                <CustomText style={{ marginLeft: 10, color: Theme.theme, fontSize: 15 }} text={'CNY' + Number(totalPrice).toFixed(2)} />
                <View style={{ flex: 1, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center' }}>
                    <Touchable onPressWithSecond={3000}
                        onPress={()=>{
                            compSwitch?this._comp_orderBtnClick():this._orderBtnClick()
                        }}
                    >
                        <View style={styles.bottom_btn}>
                            <CustomText style={{ color: 'white' }} text='下一步' />
                        </View>
                    </Touchable>
                </View>
            </View >
        )
    }
    
    _renderTipView = () => {
        const { roomModel } = this.params;
        return (
            <View  style={{ backgroundColor: Theme.greenBg,margin: 10,borderRadius:6 }}>
                {roomModel.PaymentType === 1 ?
                    <View style={{ margin: 10, padding: 10, backgroundColor: Theme.greenBg }}>
                        <CustomText text='温馨提示' style={{ fontWeight: 'bold',fontSize:14 }} />
                        <CustomText text='到店付款' />
                        <CustomText style={{ fontWeight: 'bold' }} text={`到店付需员工到酒店前台个人支付，房费到店付款，FCM不提供发票，如需消费凭证，请向酒店前台索取消费清单。`} />
                        <View style={{flexDirection:'row'}}>
                            <CustomText text='信用卡担保提示'/>
                            <CustomText text='：'/>
                        </View>
                        <CustomText style={{ fontWeight: 'bold' }} text={`1、信用卡担保可能会被刷取预授权；使用外币卡被刷预授权可能会产生手续费及汇率差。`} />
                        <View style={{flexDirection:'row'}}>
                            <CustomText text='注'/>
                            <CustomText text='：'/>
                        </View>
                        <CustomText style={{ fontWeight: 'bold' }} text={`预授权通常会涉及冻结一定金额的资金，直到交易完成或取消。这种方式可以帮助保护商家免受欺诈和付款问题的影响，并为持卡人提供更安全的交易保障。`} />
                        <CustomText style={{ fontWeight: 'bold' }} text={`2、请根据酒店要求进行担保，是否担保成功以酒店确认为准。`} />
                        <CustomText style={{ fontWeight: 'bold' }} text={`3、如收到需担保的短信和邮件，请尽快进行担保，否则可能会导致无房。`} />
                    </View> : null
                }
                
                {roomModel.PaymentType === 2 ?
                    <View style={{ margin: 10, padding: 10, backgroundColor: Theme.greenBg }}>
                        <CustomText text='温馨提示' style={{ fontWeight: 'bold' }} />
                        <CustomText text='企业月结/企业钱包' />
                        {
                            Util.Parse.isChinese()?
                            <CustomText style={{ fontWeight: 'bold' }} text={`1、该酒店确认后按照取消规则取消，可能扣除一定的费用；订单需等酒店或供应商确认后生效，订单确认结果以短信或邮件通知为准，如订单不确认将全额退款至你的付款账户。\n2、该订单不向个人提供发票，员工无需在酒店获取发票及消费明细，由公司统一结算。`} />
                            :
                            <CustomText style={{ fontWeight: 'bold' }} text={`1.Cancellation Conditions \n• Once the hotel confirms the booking, cancellation fees may apply according to the hotel’s cancellation policy.\n• The order becomes valid only after confirmation is received from the hotel or supplier. The confirmation status will be notified via SMS or email. If the order is not confirmed, a full refund will be issued to your payment account.\n2.Invoice and Payment Details\n•This order does not provide invoices / Fapiao to individuals.\n• Employees are not required to obtain invoices / Fapiao at the hotel, as all payments will be centrally settled by the company.`} />
                        }
                    </View> : null
                }
                {
                    roomModel.IsRewardPoint?
                    <View style={{ marginHorizontal: 10, marginTop:-20,paddingHorizontal: 10,paddingBottom:10, backgroundColor: Theme.greenBg }}>
                            <CustomText style={{ fontWeight: 'bold',marginTop:14 }} text={`旅客个人中心所维护的常客卡信息仅用于可积分的酒店价格计划，部分酒店价格计划供应商不支持常客卡积分，请您在酒店前台登记时与酒店确认常客卡是否可累积积分，最终以酒店确认为准，如您需要线下协助，请致电您的差旅顾问。`} />
                    </View>:null
                }
                {
                    roomModel.VendorCode === 'FLSS' || roomModel.VendorCode === 'FLST' ?
                        <View style={{ marginHorizontal: 10, marginTop: -10, paddingHorizontal: 10, paddingBottom: 10, backgroundColor: Theme.greenBg, borderBottomEndRadius: 6 }}>
                            <CustomText style={{ fontWeight: 'bold', marginTop: 14 }} text={`本页面展示的协议房型及价格仅供参考，如遇大型展会、赛事或活动期间，价格可能无法适用，最终价格及房态以酒店确认为准。`} />
                        </View>
                    :null
                }
                <View>
                    <TouchableHighlight style={{ height: 30 }} underlayColor='transparent' onPress={() => {
                        this.setState({
                            haveRead: !this.state.haveRead
                        })
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 20 }}>
                            <MaterialIcons
                                name={this.state.haveRead ? 'check-box' : 'check-box-outline-blank'}
                                size={18}
                                color={Theme.promptFontColor}
                            />
                            <CustomText allowFontScaling={false} style={{ color: Theme.commonFontColor, fontSize: 13, marginLeft: 5 }} text='已阅读上述提示' />
                        </View>
                    </TouchableHighlight>
                </View>
            </View>
        )
    }
    renderBody() {
        const { AdditionInfo, customerInfo, requestModel, ApproveList, Travellers ,roomModel,} = this.params;
        const { hotelCanselRule,compSwitch } = this.props;
        let venderAlert = "该价格可积分。请在预定时填写会员号，并在入住时将会员信息提供给酒店，具体积分规则以酒店确认为准。";
        let noVenderAlert = "该价格须以会员身份入住才可积分。请在入住时将会员信息提供给酒店，具体积分规则以酒店确认为准。";
        return (
            <LinearGradient style={{ flex: 1, position: 'relative' }} start={{x: 1, y: 0}} end={{x: 1, y: 0.5}} colors={[Theme.theme,Theme.normalBg]}>
                {/* <View style={{flexDirection:'row',paddingHorizontal:15,justifyContent:'space-between',height:44,alignItems:'center'}}>
                    <TouchableOpacity onPress={()=>{this.pop()}}>
                        <AntDesign name={'arrowleft'} size={20} color={'#fff'} />
                    </TouchableOpacity>
                    <CustomText text={'订单确认'} style={{fontSize:16, color:'#fff'}} />
                    <CustomText style={{fontSize:16, color:'#fff'}} text={''}></CustomText>
                </View> */}
                <ScrollView keyboardShouldPersistTaps='handled'>
                    <HeaderView {...this.params} otwThis={this} hotelCanselRule={hotelCanselRule}/>
                    {
                        roomModel.IsRewardPoint?
                            <View style={{marginHorizontal:10,marginTop:10,backgroundColor:'#fff',padding:15,borderRadius:6}}>
                                <TitleView2 title={'积分规则'}></TitleView2>
                                <CustomText text={(roomModel.VendorCode==='TVP' || roomModel.SubChannel==='amadeus')?venderAlert:noVenderAlert} style={{color:Theme.assistFontColor,marginTop:10}} ></CustomText>
                            </View>
                        :null
                    }
                    <PassengerSureView feeType={this.props.feeType} PassengerList={Travellers} ApproveList={ApproveList} customerInfo={customerInfo} 
                                       from={'hotel'} from2={'intlhotel'} PaymenType={roomModel.PaymentType} IsNeedIDCard={roomModel.IsNeedIDCard} />
                    {
                        !compSwitch?
                        <View style={{marginHorizontal:10,backgroundColor:'#fff',paddingHorizontal:20,paddingVertical:10,borderRadius:6}}>
                        <CustomText style={{width:'30%'}} text={'联系人'}></CustomText>
                        <View style={{flexDirection:'row',marginTop:10}}>
                            <CustomText style={{width:'30%'}} text={'联系电话'}></CustomText>
                            <CustomText style={{width:'70%',color:Theme.commonFontColor}} text={requestModel.Order?.Contact?.Mobile}></CustomText>
                        </View>
                        <View style={{flexDirection:'row',marginTop:10}}>
                            <CustomText style={{width:'30%'}} text={'Email'}></CustomText>
                            <CustomText style={{width:'70%',color:Theme.commonFontColor}} text={requestModel.Order?.Contact?.Email}></CustomText>
                        </View>
                        </View>:null
                    }                 
                    <OrderSureBottom AdditionInfo={AdditionInfo} customerInfo={customerInfo} from={'hotel'} fromNo={64} />
                    {this._renderTipView()}
                </ScrollView>
                {this._renderBottomView()}
            </LinearGradient>
        )
    }
}
const getStateProps = state => ({
    feeType: state.feeType.feeType,
    compSwitch:state.compSwitch.bool,
    comp_userInfo:state.comp_userInfo,
    compMassOrderId: state.compMassOrderId.massOrderId,
    comp_travelers: state.comp_travelers.travellers,
    compCreate_bool: state.compCreate_bool.bool,
    hotelCanselRule: state.hotelCanselRule.value,
    apply: state.apply.apply,
})

export default connect(getStateProps)(InterHotelOrderSureScreen);
const styles = StyleSheet.create({
    titleText: {
        fontSize: 18,
        color: 'white'
    },
    headerView: {
        backgroundColor: Theme.theme,
        padding: 10
    },
    bottom_btn: {
        width: 100,
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Theme.theme
    }
})
