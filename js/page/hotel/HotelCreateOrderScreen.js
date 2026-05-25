import React from 'react';
import {
    View,
    Text,
    Platform,
    StyleSheet,
    TouchableHighlight,
    TouchableOpacity,
    Dimensions,
    Alert
} from 'react-native';
import SuperView from '../../super/SuperView';
import CustomText from '../../custom/CustomText';
import ViewUtil from '../../util/ViewUtil';
import CommonService from '../../service/CommonService';
import CommonEnum from '../../enum/CommonEnum';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Theme from '../../res/styles/Theme';
import ContactView from '../common/ContactView';
import DepartView from '../common/DepartView';
import UserInfoUtil from '../../util/UserInfoUtil';
import { connect } from 'react-redux';
import AdditionInfoView from '../common/AdditionInfoView';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Util from '../../util/Util';
import I18nUtil from '../../util/I18nUtil';
import BackPress from '../../common/BackPress';
import PickerHelper from '../../common/PickerHelper';
import AdCodeEnum from '../../enum/AdCodeEnum';
import HeaderView from './HeaderView';
import CreateOrderPriceView from './CreteOrderPriceView';
import AdContentInfoView from '../common/AdContentInfoView';
import HotelService from '../../service/HotelService';
import Pop from 'rn-global-modal';
import action from '../../redux/action';
import HighLight from '../../custom/HighLight';
import OpenGetFile from '../../service/OpenGetFile';
import OpenGetPic from '../../service/OpenGetPic';
import MerchantPriceUtil from '../../util/MerchantPriceUtil'
import  LinearGradient from 'react-native-linear-gradient';
import TextViewTitle from '../../custom/TextViewTitle';
import {TitleView2} from '../../custom/HighLight';

const screenWidth = Dimensions.get('window').width
class HotelCreateOrderScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this.paramItems = props.navigation.state.params.item || {};
        this.JourneyId = props.navigation.state.params.JourneyId||0;
        this._navigationHeaderView = {
            title: '订单填写',
            // rightButton: props.feeType === 1 ? ViewUtil.getRightButton('差旅标准', this._getTravelRule) : null
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
            bottomColor: "white"
        }

        let share_AllArr = []
        for(let i=0; i<this.params.roomCount; ++i){
            share_AllArr.push([]);
        }

        this.backPress = new BackPress({ backPress: () => this._backBtnClick() })
        const { apply,comp_userInfo } = this.props;
        if(comp_userInfo&&comp_userInfo.ProjectItem && apply&&apply.ApproveOrigin){//如果订单和出差单都选择项目审批 使用出差单的项目审批规则
            if(comp_userInfo.ProjectItem.OriginType==apply.ApproveOrigin.OriginType==1){
                comp_userInfo.ProjectItem = apply.ApproveOrigin
            }
        }
        this.state = {
            // 联系人
            Contact: {
                Name: '',
                Mobile: '',
                Email: ''
            },
            travellers: [],
            // 用户信息
            userInfo: {},
            // 客户配置信息
            customerInfo: {},
            // 费用归属
            ApproveOrigin: comp_userInfo.ProjectItem?comp_userInfo.ProjectItem: 
                    // apply && apply.ApproveOrigin ? apply.ApproveOrigin : 
                    {},
            // 数据字典
            AdditionInfo: apply && apply.Addition ? {
                ...apply.Addition,
                DictItemList: apply.Addition.DictItemList ? apply.Addition.DictItemList : []
            } : {
                DictItemList: []
            },

            isFirstTip: true,

            /**
             *  预计到店时间 
             */
            LasterLiveTime: Util.Date.toDate(this.params.checkIndate.format('yyyy-MM-dd') + ' 14:00'),
            /**
             * 入住间数
             */
            roomCount: this.params.roomCount,
            // 公告
            adList: [],

            showPriceDetail: false,

            /**
             * 服务费数据
             */
            ServiceFeesData: [],
            TotalPrice:0, //酒店总价
            HotelViolationMode1:false,//超标送审
            HotelViolationMode2:false,//超标自付
            SalfChooseApprovalOrSelfPay:false,//是否展示超标自付 2选1 
            CompanyPartPriceByMergerTravelRules:0,//大于0时 房间数不能修改（申请单预订才存在）
            NewReasons:null, //合住人违规差标，有值时用它覆盖原来的超标原因
            ApplyTravelRule:null,
            ServicePrice:0,//服务费
            shareAllArr:this.props.shareAllArr?this.props.shareAllArr:share_AllArr,
            fileList:[],
            serviceP:0, //总服务费
            nullDictList:[],
            PdfDictList:[],
        }
    }
    // 重置手势滑动
    static navigationOptions = ({ navigation }) => {
        return {
            gesturesEnabled: false
        }
    }

    /**
     *  返回的操作
     */
    _backBtnClick = () => {
        this.showAlertView('您的订单尚未填写完成,是否确定要离开当前页面?', () => {
            return ViewUtil.getAlertButton('取消', () => {
                this.dismissAlertView();
            }, '确定', () => {
                this.dismissAlertView();
                this.pop();
            })
        });
        return true;
    }


    /**
       *  获取差旅标准
       */
    _getTravelRule = () => {
        this.showLoadingView();
        let model = {
            OrderCategory: CommonEnum.orderIdentification.hotel,
            }
        CommonService.GetTravelStandards(model).then(response => {
            this.hideLoadingView();
            if (response?.data?.RuleDesc?.length > 0) {
                Pop.show(
                    <View style={styles.alertStyle}>
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <CustomText text={'温馨提示'} style={{ margin: 6, fontSize: 18, fontWeight: 'bold' }} />
                        </View>
                        <View style={{ width: '100%' }}>
                            <CustomText text={response.data.OrderCategoryDesc} style={{ padding: 2, fontSize: 14, fontWeight: 'bold' }} />
                            {
                                response.data.RuleDesc.map((item) => {
                                    return (
                                        <View style={{ flexDirection: 'row', padding: 2 }}>
                                            <CustomText text={item.Name + ': ' + item.Desc} />
                                        </View>
                                    )
                                })
                            }
                        </View>
                        <TouchableHighlight underlayColor='transparent'
                            style={{ height: 40, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderTopWidth: 1, borderColor: Theme.lineColor }}
                            onPress={() => { Pop.hide() }}>
                            <CustomText text='确定' style={{ fontSize: 19, color: Theme.theme }} />
                        </TouchableHighlight>
                    </View>
                    , { animationType: 'fade', maskClosable: false, onMaskClose: () => { } })

            } else {
                this.showAlertView('国内酒店:不限');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }

    componentDidMount() {
        const { Contact, ApproveOrigin,roomCount,userInfo,AdditionInfo } = this.state;
        const { roomModel } = this.params;
        const { comp_userInfo} = this.props;
        let list = [];
        let travellersList = comp_userInfo.employees.concat(comp_userInfo.travellers);
        if(roomCount==1){
            travellersList&&travellersList.map((item)=>{
                item.shareRoomSelect = true
                list.push(item)
            })
            if(list.length>0){ 
                this.setState({
                    shareAllArr:[list]
                })
            }   
        }
        let list2 = [];
        if(roomCount>1 && travellersList.length>=2){
            travellersList&&travellersList.map((item,index)=>{
                if(index < roomCount){
                    item.shareRoomSelect = true
                    list2.push([item])
                }else{
                    item.shareRoomSelect = false
                }
            })
            this.setState({
                shareAllArr:list2
            }) 
        }
        this.setState({
            travellers: travellersList,
        })
        this.backPress.componentDidMount();
        this.showLoadingView();
        CommonService.getUserInfo().then(userInfoRes => {
            if (userInfoRes && userInfoRes.success && userInfoRes.data) {
                let userInfo = userInfoRes.data;
                let user = UserInfoUtil.getUser(userInfo);
                if (this.props.apply) {
                    // let passengers = [];
                    // UserInfoUtil.ApplyTravller(this.props.apply, passengers);
                    // UserInfoUtil.ApplyEmployee(this.props.apply, passengers);
                    // // let obj = passengers[0];
                    // // if (!obj.Id) {
                    // //     obj.isTraveller = true;
                    // // }
                    // // travellers.push([obj]);
                    // passengers.map((obj) => {
                    //     if (!obj.Id) {
                    //         obj.isTraveller = true;
                    //     }
                    //     travellers.push([obj]);
                    // })

                } else {
                    // travellers.push([user]);
                }
                Object.assign(Contact, userInfo.OrderContact ? userInfo.OrderContact : {});
                // // 布置部门
                // if (!this.props.apply) {
                //     Object.assign(ApproveOrigin, UserInfoUtil.ApproveOrigin(userInfo));
                // }
                // if (this.props.apply && !this.props.apply.ApproveOrigin) {
                //     Object.assign(ApproveOrigin, UserInfoUtil.ApproveOrigin(userInfo));
                // }

                let model={
                    ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
                    ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
                }
                CommonService.customerInfo(model).then(response => {
                    if (response && response.success) {
                        let customerInfo = response.data;
                        this.state.actionSheetOptions = UserInfoUtil.DeliveryItems(customerInfo);
                        CommonService.CurrentDictList({
                            OrderCategory: 4,
                            ShowInApply: false,
                            ShowInDemand: false,
                            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
                            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
                        }).then(currentDictList => {
                            this.hideLoadingView();
                            if (currentDictList && currentDictList.success) {
                                customerInfo.DictList = currentDictList.data;
                                // let arr=[]
                                // arr = currentDictList&&currentDictList.data&&currentDictList.data.filter(obj => {
                                //     return obj.ShowInOrder
                                // })
                                // AdditionInfo.DictItemList = arr&&arr.map((item)=>({
                                //     DictCode:item.Code,
                                //     DictEnName:item.EnName,
                                //     DictId:item.Id,
                                //     DictName:item.Name,
                                //     FormatRegexp:item.FormatRegexp,
                                //     Id:item.Id,
                                //     ItemEnName:null,
                                //     ItemId:"",
                                //     ItemInput:"",
                                //     ItemName:"",
                                //     NeedInput:item.NeedInput,
                                //     Remark:item.Remark,
                                //     RemarkNo:item.RemarkNo,
                                //     NextId:item.NextId
                                // }))
                                this.setState({
                                    userInfo,
                                    customerInfo,
                                    // DicList: arr,
                                },()=>{
                                    this._loadCurrentDicList();
                                })
                            }
                        }).catch(error => {
                            this.hideLoadingView();
                            this.toastMsg(error.message);
                        })
                    } else {
                        this.hideLoadingView();
                        this.toastMsg(response.message || '获取数据失败');
                    }
                }).catch(error => {
                    this.toastMsg(error.message);
                    this.hideLoadingView();
                })
            } else {
                this.hideLoadingView();
                this.toastMsg(userInfoRes.message || '获取数据失败');
            }
        }).catch(error => {
            this.toastMsg(error.message);
            this.hideLoadingView();
        })
        CommonService.GetAdStrategyContent(AdCodeEnum.hotelOrder).then(response => {
            if (response && response.success) {
                this.setState({
                    adList: response.data
                })
            }
        }).catch(error => {

        })
        //服务费
        let isExAgreement;
        roomModel.RpLabel&&roomModel.RpLabel.map((element)=>{
            if(element&&element.indexOf('价格计划3S协议') > -1){
                isExAgreement = true
            }
        })
        let referencEmployeeId
        if(this.props.comp_userInfo&&this.props.comp_userInfo.employees&&this.props.comp_userInfo.employees.length>0){
            let num = this.props.comp_userInfo&&this.props.comp_userInfo.employees.length-1
            referencEmployeeId = this.props.comp_userInfo.employees[num]&&this.props.comp_userInfo.employees[num].PassengerOrigin&&this.props.comp_userInfo.employees[num].PassengerOrigin.EmployeeId
        }else{
            referencEmployeeId = userInfo.Id
        }
        let SettleType ;
        if (roomModel.PaymentType === 1) {
            if (roomModel.GuaranteeRules && roomModel.GuaranteeRules.length > 0) {
                SettleType=4
            } else {
                SettleType=2
            }
        }else if (roomModel.PaymentType === 2 && roomModel.NeedCreditCard) {
            SettleType = 6
        } else {
               SettleType=1
        }
        let model = {
            OrderCategory: 4,
            MatchModel: {
                IsAgreement: this.params.orderModel.IsAgreement,
                IsExAgreement:isExAgreement,
                SettleType:SettleType,
            },
            SettleType:SettleType,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:referencEmployeeId,
        }
        CommonService.CurrentCustomerServiceFees(model).then(response => {
            if (response && response.success) {
                this.setState({
                    ServiceFeesData: response.data
                })
                this._hotelTotalPrice();
            }
        }).catch(error => {

        })
        this._loadApplyTravelRule();
        // this._loadCurrentDicList();
    }

    _loadCurrentDicList = () => {
        const {AdditionInfo, customerInfo} = this.state;
        let arr = customerInfo && customerInfo.DictList ? customerInfo.DictList : []
        let nullDictList = arr&&arr.map((item)=>({
            DictCode:item.Code,
            DictEnName:item.EnName,
            DictId:item.Id,
            DictName:item.Name,
            FormatRegexp:item.FormatRegexp,
            Id:item.Id,
            ItemEnName:null,
            ItemId:"",
            ItemInput:"",
            ItemName:"",
            NeedInput:item.NeedInput,
            Remark:item.Remark,
            RemarkNo:item.RemarkNo,
            NextId:item.NextId,
            ShowInOrder:item.ShowInOrder,
            BusinessCategory:item.BusinessCategory,
        }))
        this.setState({
            nullDictList: nullDictList,
        })

        // this.showLoadingView();
        // CommonService.CurrentDictList({
        //     OrderCategory: 0,
        //     ShowInApply: true,
        //     ShowInDemand: false,
        //     ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
        //     ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
        // }).then(response => {
        //     this.hideLoadingView();
        //     if (response && response.success) {
        //         if (response.data) {
        //             let arr = response.data.filter(obj => {
        //                 return obj.ShowInOrder
        //             })
        //             AdditionInfo.DictItemList = arr.map((item)=>({
        //                 DictCode:item.Code,
        //                 DictEnName:item.EnName,
        //                 DictId:item.Id,
        //                 DictName:item.Name,
        //                 FormatRegexp:item.FormatRegexp,
        //                 Id:item.Id,
        //                 ItemEnName:null,
        //                 ItemId:"",
        //                 ItemInput:"",
        //                 ItemName:"",
        //                 NeedInput:item.NeedInput,
        //                 Remark:item.Remark,
        //                 RemarkNo:item.RemarkNo,
        //                 NextId:item.NextId
        //             }))
        //             this.setState({
        //                 DicList: arr,
        //             })
        //         }
        //     } else {
        //         this.toastMsg(response.message || '获取数据失败');
        //     }
        // }).catch(error => {
        //     this.hideLoadingView();
        //     this.toastMsg(error.message || '获取数据异常');
        // })
    }

    _loadApplyTravelRule = () => {
        const { apply,RcReason,RsReason,RdReason } = this.props;
        if(apply){
            let model = {
                ApplyId: apply.Id,
                RatePlan:this.params.roomModel,
                IsViolation: (RcReason||RsReason||RdReason)?true:false, //是否超标
                ViolationMode: this.params.RcModel?this.params.RcModel.ViolationMode:0  //超标模式
            }
        this.showLoadingView();
        HotelService.HotelApplyTravelRule(model).then(response => {
            this.hideLoadingView();
            if(response && response.success){
                this.setState({
                    ApplyTravelRule: response.data,
                })
            }
        }).catch(error=>{
            this.hideLoadingView();
        })
        }
    }

    _hotelTotalPrice = () => {
        const { ServiceFeesData, roomCount, travellers } = this.state;
        const { roomModel, liveDay } = this.params
        var serviceFee = 0;
        var VipServiceFee = 0;
        var servicePrice = 0;
        let vip = 0;
        let pub = 0;
        var personList = [];
        let totalPrice = roomModel.AvgPrice * liveDay * roomCount;
        travellers && travellers.map(item => {
                personList.push(item);
        })
        personList && personList.forEach((item) => {
            if (item.IsVip) {
                vip++;
            } else {
                pub++;
            }
        })
        ServiceFeesData && ServiceFeesData.ServiceFees && ServiceFeesData.ServiceFees.map((item) => {//非VIP
            if (item.FeeValueType == 1) {
                serviceFee += Number(item.Price);
            }
            else if (item.FeeValueType == 2) {
                item.Price = Number((item.FeeValue * roomModel.AvgPrice * liveDay).toFixed(2));
                serviceFee += item.Price;
            }
        })
        ServiceFeesData && ServiceFeesData.VipServiceFees && ServiceFeesData.VipServiceFees.map((item) => {//VIP
            if (item.FeeValueType == 1) {
                VipServiceFee += Number(item.Price);
            }
            else if (item.FeeValueType == 2) {
                item.Price = Number((item.FeeValue * roomModel.AvgPrice * liveDay).toFixed(2));
                VipServiceFee += item.Price;
            }
        })

        if (ServiceFeesData.TollType === 1) {//按夜间收
            if (vip > 0) {
                servicePrice = VipServiceFee * liveDay * roomCount
            } else {
                servicePrice = serviceFee * liveDay * roomCount
            }
        } else if (ServiceFeesData.TollType === 2) {//按订单收取
            if (vip > 0) {
                servicePrice = VipServiceFee
            } else {
                servicePrice = serviceFee
            }
        } else if (ServiceFeesData.TollType === 3) {//按房间收取
            if (vip > 0) {
                servicePrice = VipServiceFee * roomCount
            } else {
                servicePrice = serviceFee * roomCount
            }
        }
        totalPrice = (ServiceFeesData && ServiceFeesData.IsShowServiceFee || this.props.feeType === 2) ? totalPrice + servicePrice : totalPrice
        this.setState({
            TotalPrice: totalPrice,
            ServicePrice: servicePrice
        })
        this._hotelSalfChooseApprovalOrSelfPay();  
    }

    getHotelShare(){//判断合住
        const { apply } = this.props;
        const { travellers,roomCount } = this.state;
        if(apply&&apply.selectApplyItem && travellers ){
            let passengerCount = 0;
            if (
                apply?.selectApplyItem?.ExtensionJson?.HotelExtensionJson?.RoomNumber > 0 &&
                Array.isArray(apply.selectApplyItem.ExtensionJson.HotelExtensionJson.ChummageRoomConfigs) &&
                apply.selectApplyItem.ExtensionJson.HotelExtensionJson.ChummageRoomConfigs.length > 0
            ) {
                apply.selectApplyItem.ExtensionJson.HotelExtensionJson.ChummageRoomConfigs.forEach(element => {
                    if (Array.isArray(element.ChummagePassengers) && element.ChummagePassengers.length > passengerCount) {
                        passengerCount = element.ChummagePassengers.length;
                    }
                });
            }
            if(travellers.length>1 && roomCount==1 && passengerCount == travellers.length){
                return true;
            }
        }else{
            return false
        }
    }

    _hotelSalfChooseApprovalOrSelfPay =()=>{

        const { RcReason, checkIndate, liveDay } = this.params;
        const { TotalPrice, roomCount, travellers } = this.state;
        const { apply } = this.props;
        let referencEmployeeId
        if(this.props.comp_userInfo&&this.props.comp_userInfo.employees&&this.props.comp_userInfo.employees.length>0){
            let num = this.props.comp_userInfo&&this.props.comp_userInfo.employees.length-1
            referencEmployeeId = this.props.comp_userInfo.employees[num]&&this.props.comp_userInfo.employees[num].PassengerOrigin&&this.props.comp_userInfo.employees[num].PassengerOrigin.EmployeeId
        }else{
            referencEmployeeId = userInfo.Id
        }
        let CheckOutDate = checkIndate.addDays(liveDay);
        let reason = RcReason&&RcReason.filter(item => item !== null);
    
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
        let model = {
            CityId: this.params.CityId, ///城市code
            HotelPrice: TotalPrice,  //酒店价格
            StarRate: this.params.orderModel.StarRate,  //挂牌星级
            RecommendStar: this.params.orderModel.RecommendStar, //推荐星级
            RulesTravelId: null,// 可以不传	
            CheckIn:checkIndate.format('yyyy-MM-dd', true),
            CheckOut:CheckOutDate.format('yyyy-MM-dd', true),
            PaymentType: this.params.roomModel.PaymentType, //酒店支付方式
            ApplyId:apply&&apply.Id,//申请单编号校验合住人使用 可不传
            JourneyId:journeyid,//行程编号跟随出差单使用
            Domestic: true,//酒店国内国际 true 国内酒店，false 国际酒店
            Reason: reason,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:referencEmployeeId,
            HotelShare: this.getHotelShare()
        }
        this.showLoadingView();
        HotelService.HotelSalfChooseApprovalOrSelfPay(model).then(response => {
            this.hideLoadingView();
            if(response && response.success){
                this.setState({
                    SalfChooseApprovalOrSelfPay:response.data.SalfChooseApprovalOrSelfPay,
                    CompanyPartPriceByMergerTravelRules:response.data.CompanyPartPriceByMergerTravelRules,
                    NewReasons:response.data.NewReasons
                })
            }
        }).catch(error=>{
            this.hideLoadingView();
        })
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.backPress.componentWillUnmount();
        PickerHelper.hide();
    }
    _selectLaterDate = () => {
        let arr = this._createDateData();
        let checkIn = this.params.checkIndate;
        let lasterCheck = checkIn.addDays(1);
        PickerHelper.create(arr, [arr[0]], (obj) => {
            let date = Util.Date.toDate(checkIn.getFullYear() + '-' + obj.join(' '));
            if (checkIn.getFullYear() !== lasterCheck.getFullYear()) {
                if (date < checkIn) {
                    date = date.addDays(1);
                }
            }
            this.setState({
                LasterLiveTime: date
            })
        })
    }
    _createDateData = () => {
        let checkInDate = this.params.checkIndate;
        let checkIn = Util.formatDate(this.params.checkIndate, 'MM-dd')
        let nowDate = new Date();
        let nowHours = nowDate.getHours();
        let nowMins = nowDate.getMinutes();
        let nowYear = nowDate.getFullYear();
        let nowMoth = nowDate.getMonth();
        let nowDay = nowDate.getDate();
        let checkYear = checkInDate.getFullYear();
        let checkMonth = checkInDate.getMonth();
        let checkDay = checkInDate.getDate();
        var hourData = [];

        if (nowHours >= 14 && nowYear == checkYear && nowMoth == checkMonth && nowDay == checkDay) {
            for (let i = nowHours; i < 24; i++) {
                for (let j = 0; j < 60; j++) {
                    if (i == nowHours && j < nowMins) {
                        continue;
                    } else {
                        let obj = null;
                        if (j < 10 && j == 0) {
                            obj = checkIn + ' ' + i + ':' + '0' + j;
                        } else if (j == 30) {
                            obj = checkIn + ' ' + i + ':' + j;
                        } else {
                            continue;
                        }
                        hourData.push(obj);
                    }
                }
            }
        } else {
            for (let i = 14; i < 24; i++) {
                for (let j = 0; j < 60; j++) {
                    let obj = null;
                    if (j < 10 && j == 0) {
                        obj = checkIn + ' ' + i + ':' + '0' + j;
                    } else if (j == 30) {
                        obj = checkIn + ' ' + i + ':' + j;
                    } else {
                        continue;
                    }
                    hourData.push(obj);
                }

            }
        }
        // let nextCheckIn = checkInDate.addDays(1).format('MM-dd');
        let nextCheckIn = Util.formatDate(checkInDate.addDays(1), 'MM-dd')
        for (let i = 0; i <= 6; i++) {
            for (let j = 0; j < 60; j++) {
                let obj = null;
                if (i == 6 && j == 0) {
                    obj = nextCheckIn + ' ' + '0' + i + ':' + '0' + j;
                } else if (i == 6 && i > 0) {
                    break;
                }
                if (j < 10 && j == 0) {
                    obj = nextCheckIn + ' ' + '0' + i + ':' + '0' + j;
                } else if (j == 30) {
                    obj = nextCheckIn + ' ' + '0' + i + ':' + j;
                } else {
                    continue;
                }
                hourData.push(obj);
            }
        }
        return hourData;
    }
    _orderBtnClick = (totalPrice) => {
        const { travellers, customerInfo, AdditionInfo, userInfo, 
                ApproveOrigin, Contact, roomCount, LasterLiveTime,
                SalfChooseApprovalOrSelfPay,HotelViolationMode1,HotelViolationMode2,
                CompanyPartPriceByMergerTravelRules,NewReasons,shareAllArr,fileList,serviceP,ApplyTravelRule,nullDictList
              } = this.state;
        const { roomModel, RcReason,ShareRoomApplyFlag,SearchGuestNum } = this.params;
        const { comp_userInfo } = this.props;
        var RcReasons = RcReason && RcReason.filter(i => i)
        let arrPerson = [];
        let isEmployAlert = false;
        if (shareAllArr && shareAllArr.length > 0 && travellers.length>1) {
            for (const item of shareAllArr) {
                if (item.length < 1) {
                    this.toastMsg('每间房间至少对应一位入住人');
                    isEmployAlert = true
                    break; // 立即停止循环
                }else{
                    item.forEach((obj)=>{
                        arrPerson.push(obj);
                    })
                }
            }
            if (isEmployAlert) {
                return;
            }
        }
        if((roomCount < travellers.length) && (arrPerson.length<travellers.length)){
            this.toastMsg('入住人未选完');
            return;
        }
        if (!LasterLiveTime) {
            this.toastMsg('预计到店时间不能为空');
            return;
        }
        // if (!Contact.Name) {
        //     this.toastMsg('请填写联系人');
        //     return;
        // }
        if (!Contact.Mobile) {
            this.toastMsg('请填写联系人电话');
            return;
        }
        if(SalfChooseApprovalOrSelfPay && (!HotelViolationMode1 && !HotelViolationMode2)){
            this.toastMsg('请选择超标处理模式');
            return;
        }
        let TravellerList = [];
        let CertificateNum = '';

        let DicListArr = [];
        let EmployeeDictListArr = [];
        let diffDicList = [];
        let customerDicList = customerInfo.DictList;
        customerDicList && customerDicList.map((item) => {
            DicListArr.push(item.Id);
        })
        customerInfo.EmployeeDictList && customerInfo.EmployeeDictList.map((item) => {
            EmployeeDictListArr.push(item.Id);
        })
        let diffArr = DicListArr.filter(function (val) { //算出公司字典和用户字典的差集：公司字典含有的、用户字典没有含有的 展示在公司字典处
            return EmployeeDictListArr&&EmployeeDictListArr.indexOf(val) === -1
        })
        customerDicList && customerDicList.map((item) => {
            diffArr&&diffArr.map((diffitem) => {
                if (item.Id == diffitem) {
                    diffDicList.push(item)
                }
            })
        })
        var getVisibleDictIdSet = function (dictConfigList, dictMapList, dictItemList) {
            var configs = dictConfigList || [];
            var mapList = dictMapList || [];
            var configById = {};
            var childIdSet = new Set();
            configs.forEach(function (cfg) {
                if (cfg && cfg.Id !== undefined) {
                    configById[cfg.Id] = cfg;
                }
                if (cfg && cfg.NextId) {
                    childIdSet.add(cfg.NextId);
                }
            });
            var rootIds = [];
            configs.forEach(function (cfg) {
                const isCascadeChild = cfg && cfg.BeforeParentNameList && cfg.BeforeParentNameList.length > 0;
                if (cfg && cfg.Id !== undefined && !childIdSet.has(cfg.Id) && (cfg.ShowInOrder || isCascadeChild)) {
                    rootIds.push(cfg.Id);
                }
            });
            var visibleIdSet = new Set();
            var visiting = new Set();
            var visit = function (id) {
                if (!id || visibleIdSet.has(id) || visiting.has(id)) return;
                visiting.add(id);
                visibleIdSet.add(id);
                var cfg = configById[id];
                var nextId = cfg && cfg.NextId;
                if (nextId) {
                    var parentItem = dictItemList && dictItemList.find(function (it) {
                        if (!it) return false;
                        if (cfg && cfg.Code !== undefined && it.DictCode == cfg.Code) return true;
                        return it.DictId == id;
                    });
                    var parentName = parentItem && parentItem.ItemName;
                    var rules = mapList && mapList.filter(function (m) { return m && m.DictId == nextId; });
                    if (!rules || rules.length === 0) {
                        visit(nextId);
                    } else if (parentName && rules.some(function (m) { return m && m.ParentName == parentName; })) {
                        visit(nextId);
                    }
                }
                visiting.delete(id);
            };
            rootIds.forEach(function (id) { visit(id); });
            return visibleIdSet;
        };
        let alertWarning = 0;
        let SeqNo = 0;
        
        for (let index = 0; index < travellers.length; index++) {
            const obj = travellers[index];
            if(customerInfo.EmployeeDictList&&customerInfo.EmployeeDictList.length>0){
                const visibleIdSet = getVisibleDictIdSet(customerInfo.EmployeeDictList, customerInfo.DictMapList, obj.Addition && obj.Addition.DictItemList);
                for (let i = 0; i < customerInfo.EmployeeDictList.length; i++) {
                   if (!visibleIdSet.has(customerInfo.EmployeeDictList[i].Id)) {
                       continue;
                   }
                   let itemIndex =  obj.Addition&&obj.Addition.DictItemList&&obj.Addition.DictItemList.find(item => {
                       if (!item) return false;
                       if (customerInfo.EmployeeDictList[i].Code !== undefined && item.DictCode == customerInfo.EmployeeDictList[i].Code) return true;
                       return item.DictId == customerInfo.EmployeeDictList[i].Id;
                   });
                   if(!itemIndex){
                       itemIndex = customerInfo.EmployeeDictList[i]
                       itemIndex.DictName =Util.Parse.isChinese() ? customerInfo.EmployeeDictList[i].Name : customerInfo.EmployeeDictList[i].EnName
                   }
                   const isCascadeChild = customerInfo.EmployeeDictList[i].BeforeParentNameList && customerInfo.EmployeeDictList[i].BeforeParentNameList.length > 0;
                   if(customerInfo.EmployeeDictList[i].IsRequire && (customerInfo.EmployeeDictList[i].ShowInOrder || isCascadeChild)){
                       if (customerInfo.EmployeeDictList[i].NeedInput && !itemIndex.ItemName) {
                           this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(itemIndex.DictName)));
                           return;
                       } else if (!customerInfo.EmployeeDictList[i].NeedInput && !itemIndex.ItemId) {
                           this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(itemIndex.DictName)));
                           return;
                       }
                   }
               }
           }
        }

        travellers.forEach((obj, index) => {
                if (alertWarning) return;
                let showName =  (obj.NationalCode == 'CN' || obj.NationalCode == 'HK' || obj.NationalCode == 'MO' || obj.NationalCode == 'TW' || !obj.NationalCode)
                if (!obj.Email && customerInfo.EmailRequired) {
                    this.toastMsg(I18nUtil.tranlateInsert('{{noun}} Email不能为空', obj.Name));
                    alertWarning = 1
                    return;
                } 
                if (!obj.Mobile) {
                    this.toastMsg(I18nUtil.tranlateInsert('{{noun}} 手机号不能为空', obj.Name));
                    alertWarning = 1
                    return;
                }else if (!Util.RegEx.isMobile(obj.Mobile)) {
                    this.toastMsg('手机号格式不正确');
                    alertWarning = 1
                    return;
                } 
                if(this._isVendorCodeTVP() && !obj.Surname){
                    this.toastMsg('英文姓不能为空');
                    alertWarning = 1
                    return;
                }else if(Util.RegEx.isEnName(obj.Surname) &&((!showName && !obj.selectCn) ||this._isVendorCodeTVP())){
                    this.toastMsg("英文名称只能包含字母");
                    alertWarning = 1
                    return;
                }
                if(this._isVendorCodeTVP() && !obj.GivenName){
                    this.toastMsg('英文名不能为空');
                    alertWarning = 1
                    return;
                }else if(Util.RegEx.isEnName(obj.GivenName) && ((!showName && !obj.selectCn) ||this._isVendorCodeTVP())){
                    this.toastMsg("英文名称只能包含字母");
                    alertWarning = 1
                    return;
                }
                if (obj && obj.Name) {
                    let type = '';
                    let referId = '';
                    let TypeDesc = ''
                    SeqNo = SeqNo + 1;
                    if (!obj.isTraveller) {
                        type = 1;
                        referId = obj?.PassengerOrigin?.EmployeeId;
                        TypeDesc="员工"
                    } else {
                        type = 2;
                        referId = obj.Id ? obj.Id : 0;
                        TypeDesc="常旅客"
                    }
                    if (roomModel.IsNeedIDCard) {
                        if (obj.CertificateId == 1) {
                            CertificateNum = obj.CertificateNumber
                        } else {
                            if (obj.Certificate && typeof (obj.Certificate) === 'string') {
                                let CertificateList = JSON.parse(obj.Certificate) || [];
                                let CertificateNums = CertificateList.find(item => item.Type === 1);
                                CertificateNum = CertificateNums && CertificateNums.SerialNumber;
                            }
                        }
                    }
                    let certificateModel = {
                        Type: Util.Read.certificateType2(obj.CertificateType ? obj.CertificateType : '身份证'),
                        SerialNumber: obj.CertificateNumber,
                        Expire: obj.CertificateExpire,//有效期
                        IssueNationName: obj.NationalName,//签发国
                        NationalName: obj.NationalName,//国籍
                        NationalCode: obj.NationalCode,
                        IssueNationCode: obj.NationalCode,
                        Birthday: obj.Birthday,
                        Sex:obj.Sex?obj.Sex:obj.Gender,
                    }
                    
                    let model = {
                        Sex: obj.Sex?obj.Sex:obj.Gender,
                        Name:this._isVendorCodeTVP()? obj.Surname+'/'+obj.GivenName : obj.Name,
                        FirstName:obj.GivenName,
                        LastName:obj.Surname,
                        Surname: obj.Surname,
                        GivenName: obj.GivenName,
                        Birthday: obj.Birthday,
                        Certificate: certificateModel,
                        OriginType: type,
                        ReferId: referId,
                        Mobile: obj.Mobile ? obj.Mobile : '',
                        Phone: obj.Mobile ? obj.Mobile : (obj.Phone ? obj.Phone : ''),
                        Email: obj.Email ? obj.Email : '',
                        RoomNumber: obj.RoomNumber?obj.RoomNumber:1,
                        SeqNo: SeqNo,
                        CheckInTypeOfCertificate: roomModel.IsNeedIDCard ? 1 : '',
                        CheckInCertificate: roomModel.IsNeedIDCard ? CertificateNum ? CertificateNum : '' : '',
                        IsVip: obj.IsVip === 1 ? true : false,
                        PassengerOrigin:{
                            Type:type,
                            TypeDesc: TypeDesc,
                            EmployeeId: obj?.PassengerOrigin?.EmployeeId,                            
                            TravellerId: 0,
                            EmployeeDesc: obj.Name,
                            TravellerDesc: null
                        },
                        Nationality: obj.NationalCode,
                        NationalityCode: obj.NationalCode,
                        NationalName: obj.NationalName,//国籍
                        NationalCode: obj.NationalCode,
                        // Addition:obj.Addition?obj.Addition:obj.AdditionInfo,
                        Addition:obj.Addition?obj.Addition:obj.AdditionInfo?obj.AdditionInfo:null,
                        HotelCardTravellerList:obj.HotelCardTravellerList,
                        HotelCardTraveller:obj.CardTravel&&[0]&&obj.CardTravel[0].SerialNumber,
                        HotelGroupId:obj.CardTravel&&[0]&&obj.CardTravel[0].HotelGroupId,
                        HotelGroupName:obj.CardTravel&&[0]&&obj.CardTravel[0].HotelGroupName,
                        // HotelCardTravellerList:obj.CardTravel,

                    }
                    TravellerList.push(model);
                }
            })
        if (alertWarning) return;
        const totalCount = shareAllArr.reduce((sum, subArr) => sum + subArr.length, 0);//入住人总数
        if(totalCount < roomCount * SearchGuestNum){
            this.showAlertView('您选择了2 人一间的房间，为顺利提交订单和入住，请在提交预订前完善每间房的同住人信息，确保信息与实际入住人完全一致。', () => {
                return ViewUtil.getAlertButton('确定', () => {
                    this.dismissAlertView();
                })
            });
            return;
        }
        let addpersons = [];//添加的同住人
        shareAllArr.map((item,index)=>{
            item.map((obj)=>{
                if(obj.IsTempCustomer){
                    addpersons.push(obj);
                }
            })
        })
        
        if (roomModel.IsNeedIDCard) {
            if (!CertificateNum) {
                this.toastMsg('入住人身份证号码不能为空');
                return
            }
        }

        if (this.props.feeType === 1) {
            let addition = UserInfoUtil.Addition(customerInfo);
            for (let index = 0; index < addition.length; index++) {
                const obj = addition[index];
                if (obj.state && !AdditionInfo[obj.en]) {
                    this.toastMsg(obj.name + '不能为空');
                    return;
                }
            }
            // if (customerInfo.DictList) {
            //     for (let i = 0; i < customerInfo.DictList.length; i++) {
            //         const obj = customerInfo.DictList[i];
            //         if (obj.IsRequire) {
            //             if (userInfo && userInfo.Customer.Id === Customer.DRHJ && obj.Name === '实施阶段') {
            //                 continue;
            //             }
            //             let dicItem = AdditionInfo.DictItemList.find(dic => dic.DictId === obj.Id);
            //             if (!dicItem) {
            //                 this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(obj.Name)));
            //                 return;
            //             } else {
            //                 if (obj.NeedInput && !dicItem.ItemName) {
            //                     this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(obj.Name)));
            //                     return;
            //                 } else if (!obj.NeedInput && !dicItem.ItemId) {
            //                     this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(obj.Name)));
            //                     return;
            //                 }
            //             }
            //         }

            //     }
            // }
            // if (ApproveOrigin.OriginType === 1 && ApproveOrigin.ProjectId === '0') {
            //     let proLablel = customerInfo.Setting.ProjectLabel ? customerInfo.Setting.ProjectLabel : '项目出差';
            //     this.toastMsg('请选择' + proLablel);
            //     return;
            // }
            // if (ApproveOrigin.OriginType === 3 && ApproveOrigin.ApproverId === '0') {
            //     this.toastMsg('请选择授权人');
            //     return;
            // }
        }
        let OrderReason = {
            CustomerReasonId: this.params.RcReason ? this.params.RcReason.Id : '',
            Reason: this.params.RcReason ? this.params.RcReason.Reason : '',
            LowestFlight: '',
            RuleType: 5,
            OrderCategory: 4
        }
        // this.params.RcReason.map((item)=>{
        //     CustomerReasonId:this.params.RcReason.Id,
        // })
        let OrderReasons =
            RcReasons && RcReasons.map(item => ({
                CustomerReasonId: item.Id,
                Reason: item.Reason,
                ReasonCode :item.ReasonCode,
                ReasonEn:item.ReasonEn,
                LowestFlight: '',
                RuleType: 5,
                OrderCategory: 4
            }))
        const { checkIndate, liveDay, orderModel, roomIdModel, LimitPrice, ViolationMode, RcModel } = this.params;
        let CheckOutDate = checkIndate.addDays(liveDay);
        // let companyCost = 0;
        // let peronalCost = 0;
        // if (RcModel && RcModel.ViolationMode == 3 && parseFloat(RcModel.PriceLimit) < roomModel.AvgPrice) {
        //     // companyCost = RcModel.PriceLimit * liveDay * roomCount;
        //     companyCost = totalPrice;
        //     peronalCost = (parseFloat(roomModel.AvgPrice) - parseFloat(RcModel.PriceLimit)) * liveDay * roomCount;
        // } else {
        //     // companyCost = roomModel.AvgPrice * liveDay * roomCount;
        //     companyCost = totalPrice;
        // }
        let companyCost = 0;
        let peronalCost = 0;
        let PriceLimit = 0;
        if (RcModel){
            PriceLimit = parseFloat(RcModel&&RcModel.PriceLimit);
        }
        if(ApplyTravelRule){
            if(CompanyPartPriceByMergerTravelRules && CompanyPartPriceByMergerTravelRules>0){
                companyCost =  parseFloat(roomModel.TotalPrice)  * roomCount > CompanyPartPriceByMergerTravelRules * liveDay ? CompanyPartPriceByMergerTravelRules * liveDay : parseFloat(selectRoom.TotalPrice) * roomCount;
            }else{
                const { IsUsedApplyBudget, RestApplyBudget, ViolationMode } = ApplyTravelRule;
                if(IsUsedApplyBudget && ViolationMode == 3){
                    companyCost = (roomModel.AvgPrice * liveDay * roomCount) > RestApplyBudget ? RestApplyBudget : (selectRoom.AvgPrice * liveDay * roomCount);
                }
                //前台现付不计算公司或个人金额
                else if (RcModel && (RcModel.CityLevelLimit || RcModel.StarRateLimit || RcModel.AdvanceDayLimit) && (ViolationMode == 3 || ViolationMode == 4)) {
                    companyCost = PriceLimit * liveDay * roomCount;
                } else {
                    companyCost = roomModel.TotalPrice * roomCount;
                }
            }}else{
                if (RcModel && (RcModel.ViolationMode == 3 || RcModel.ViolationMode==4)) {
                    companyCost = PriceLimit * liveDay * roomCount;
                } else {
                    companyCost = roomModel.TotalPrice * roomCount;
                }  
            
        }
        companyCost = serviceP+companyCost

        if(ApplyTravelRule){
            if(CompanyPartPriceByMergerTravelRules && CompanyPartPriceByMergerTravelRules>0){
                peronalCost = (parseFloat(roomModel.TotalPrice) - CompanyPartPriceByMergerTravelRules * liveDay) * roomCount < 0 ?
                0 : (parseFloat(roomModel.TotalPrice) - CompanyPartPriceByMergerTravelRules * liveDay) * roomCount;
            }else{
                const { IsUsedApplyBudget, RestApplyBudget, ViolationMode } = ApplyTravelRule;
                if(IsUsedApplyBudget && ViolationMode == 3){
                    let price = ((parseFloat(roomModel.AvgPrice) - PriceLimit) * liveDay * roomCount);
                    peronalCost = price>RestApplyBudget? price - RestApplyBudget : 0;
                }
                //前台现付不计算公司或个人金额
                else if (parseFloat(roomModel.AvgPrice) > PriceLimit &&  RcModel && (RcModel.CityLevelLimit || RcModel.StarRateLimit || RcModel.AdvanceDayLimit) && (ViolationMode == 3 || ViolationMode == 4)) {
                    peronalCost = (parseFloat(roomModel.AvgPrice) - PriceLimit) * liveDay * roomCount; 
                }
                }
        }else{
                if (RcModel && (RcModel.ViolationMode == 3||RcModel.ViolationMode == 4) && roomModel.TotalPrice > PriceLimit) {
                    peronalCost = (parseFloat(roomModel.TotalPrice) - (PriceLimit * liveDay)) * roomCount;
                }
        }
        if (diffDicList && this.props.feeType === 1) {
            const visibleCompanyIdSet = getVisibleDictIdSet(diffDicList, customerInfo.DictMapList, AdditionInfo && AdditionInfo.DictItemList);
            for (let i = 0; i < diffDicList.length; i++) {
                const obj = diffDicList[i];
                if (!visibleCompanyIdSet.has(obj.Id)) {
                    continue;
                }
                let dicItem = AdditionInfo&&AdditionInfo.DictItemList&&AdditionInfo.DictItemList.find(item => 
                    // obj.NeedInput ? item.DictName === obj.Name : item.DictId === obj.Id
                    item.DictCode === obj.Code
                );
                let regex=new RegExp(dicItem?.FormatRegexp)
                const isCascadeChild = obj.BeforeParentNameList && obj.BeforeParentNameList.length > 0;
                if (obj.IsRequire && (obj.ShowInOrder || isCascadeChild)) {
                    if (!dicItem) {
                        this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(obj.Name)));
                        return;
                    } else {
                        let regex;
                        if(dicItem.FormatRegexp){
                            regex = new RegExp(dicItem.FormatRegexp)
                        }
                        if (obj.NeedInput && !dicItem.ItemName) {
                            this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(obj.Name)));
                            return;
                        } else if (!obj.NeedInput && !dicItem.ItemId) {
                            this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(obj.Name)));
                            return;
                        } 
                        // else if (regex && !regex.test(dicItem.ItemName)) {
                        //     this.toastMsg(I18nUtil.tranlateInsert('{{noun}}格式不符合规则', I18nUtil.translate(Util.Parse.isChinese()?dicItem.DictName:dicItem.DictEnName)));
                        //     // this.toastMsg(dicItem.DictName + '格式不符合规则');
                        //     return;
                        // }
                    }
                }
                if(dicItem?.ItemName && dicItem?.FormatRegexp&&!regex.test(dicItem.ItemName)){
                    // this.toastMsg(dicItem.DictName+'格式不符合规则');
                    this.toastMsg(I18nUtil.tranlateInsert('{{noun}}格式不符合规则', I18nUtil.translate(Util.Parse.isChinese()?dicItem.DictName:dicItem.DictEnName)));
                    return;
                }
            }
        }
        const setting = customerInfo.Setting;
        if(setting&&setting.AttachmentConfig&&setting.AttachmentConfig.HotelNecessary){
            if(fileList.length==0){
                this.toastMsg('未上传附件');
                return;
            }
        }

        let referencEmployeeId
        if(this.props.comp_userInfo&&this.props.comp_userInfo.employees&&this.props.comp_userInfo.employees.length>0){
            let num = this.props.comp_userInfo&&this.props.comp_userInfo.employees.length-1
            referencEmployeeId = this.props.comp_userInfo.employees[num]&&this.props.comp_userInfo.employees[num].PassengerOrigin.EmployeeId
        }else{
            referencEmployeeId = userInfo.Id
        }
        let AttachmentModel = {
            AttachmentItems:fileList
        }
        
        let emailArr2 = Contact?.Email?.split(';').filter(item => item);
        if(emailArr2?.length>4){
            this.toastMsg('联系人邮箱最多维护4个');
            return;
        }
        if(emailArr2?.length>0){
            for (const item of emailArr2) {
                if (!Util.RegEx.isEmail(item)) {
                    this.toastMsg('请输入正确的邮箱格式');
                    return; // 立即终止函数执行
                }
            }
        }
        
        let order = {
            Contact: Contact,
            CheckInDate: checkIndate.format('yyyy-MM-dd', true),
            CheckOutDate: CheckOutDate.format('yyyy-MM-dd', true),
            RoomCount: roomCount,
            SearchGuestNum: SearchGuestNum,
            NightCount: liveDay,
            LastCheckInTime: LasterLiveTime.format('yyyy-MM-dd HH:mm', true),
            GuaranteeRule: roomModel.GuaranteeRules,
            FeeType: this.props.feeType,
            IsAgreement: orderModel.IsAgreement,
            ApplyId: this.props.apply ? this.props.apply.Id : 0,
            CompanyAmount: companyCost,
            PersonalAmount: peronalCost,
            SettleType: customerInfo.SettleType,
            Domestic: true,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:referencEmployeeId,
            Attachment:AttachmentModel,
            ShareRoomApplyFlag:ShareRoomApplyFlag,
            ExcessAmount:LimitPrice,
            JourneyId:this.JourneyId
        }

        const dictConfigList = customerInfo && Array.isArray(customerInfo.DictList) ? customerInfo.DictList : [];
        const hotelDictConfigs = dictConfigList.filter(cfg => cfg && (cfg.BusinessCategory & 4));
        const existCompanyDictItemList = AdditionInfo && Array.isArray(AdditionInfo.DictItemList) ? AdditionInfo.DictItemList : [];
        const nullCompanyDictList = hotelDictConfigs.map((item) => ({
            DictCode: item.Code,
            DictEnName: item.EnName,
            DictId: item.Id,
            DictName: item.Name,
            FormatRegexp: item.FormatRegexp,
            Id: item.Id,
            ItemEnName: null,
            ItemId: "",
            ItemInput: "",
            ItemName: "",
            NeedInput: item.NeedInput,
            Remark: item.Remark,
            RemarkNo: item.RemarkNo,
            NextId: item.NextId,
            ShowInOrder: item.ShowInOrder,
            BusinessCategory: item.BusinessCategory,
        }));
        existCompanyDictItemList.forEach((it) => {
            if (!it) return;
            const dictId = it.DictId || it.Id;
            let index = -1;
            if (dictId !== undefined && dictId !== null) {
                index = nullCompanyDictList.findIndex(e => e && (e.Id == dictId || e.DictId == dictId));
            }
            if (index === -1 && it.DictCode !== undefined) {
                index = nullCompanyDictList.findIndex(e => e && e.DictCode == it.DictCode);
            }
            if (index > -1) {
                const base = nullCompanyDictList[index];
                nullCompanyDictList[index] = {
                    ...base,
                    ...it,
                    Id: base.Id,
                    DictId: base.DictId,
                    DictCode: base.DictCode,
                    DictName: base.DictName,
                    DictEnName: base.DictEnName,
                    NeedInput: base.NeedInput,
                    NextId: base.NextId,
                    ShowInOrder: base.ShowInOrder,
                    FormatRegexp: base.FormatRegexp,
                    Remark: base.Remark,
                    RemarkNo: base.RemarkNo,
                    BusinessCategory: base.BusinessCategory,
                };
            }
        });
        const childIdSet = new Set();
        hotelDictConfigs.forEach((cfg) => {
            if (cfg && cfg.NextId) childIdSet.add(cfg.NextId);
        });
        const visibleCompanyIdSet = getVisibleDictIdSet(hotelDictConfigs, customerInfo && customerInfo.DictMapList, nullCompanyDictList);
        AdditionInfo.DictItemList = nullCompanyDictList.filter((it) => {
            const dictId = it && (it.DictId || it.Id);
            if (!dictId) return false;
            if (!childIdSet.has(dictId)) return true;
            return visibleCompanyIdSet && visibleCompanyIdSet.has(dictId);
        });
        let newTravellers;
        if (this._isVendorCodeTVP()) {
            newTravellers = travellers.map(obj => ({
                ...obj,
                Name: `${obj.Surname}/${obj.GivenName}`
            }));
        } else {
            newTravellers = travellers;
        }
        //合并添加的同住人
        TravellerList = [...TravellerList,...addpersons];
        var requestModel = {
            AdditionInfo: AdditionInfo,
            ApproveOrigin: ApproveOrigin,
            Customers: TravellerList,
            Order: order,
            RatePlan: roomModel,
            Hotel: orderModel,
            Room: roomIdModel,
            OrderReasons:NewReasons&&NewReasons.length>0? NewReasons : OrderReasons,
            IgnoreConfirm: false,
            Platform: Platform.OS,
            CityId: this.params.CityId,
            SelfChooseDomesticHotelViolationModeForCityLevelMode:HotelViolationMode1 ? 2 : HotelViolationMode2 ? 3 : 0,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:referencEmployeeId,
        }
        let params = Object.assign({ requestModel, from: 'hotel', passengerList: TravellerList, totalPrice: totalPrice,userInfo:userInfo }, this.params, this.state);
        if (this.props.feeType === 2) {
            this.push('HotelOrderSure', params);
            return;
        }

        let currentUser = UserInfoUtil.getUser(userInfo);

        let PassengerList = [
            {
                Name: currentUser.Name,
                PassengerType: '1',
                Certificate: {
                    SerialNumber: currentUser.CertificateNumber,
                    Type: Util.Read.certificateType(currentUser.CertificateType ? currentUser.CertificateType : '身份证')
                },
                PassengerOrigin: {
                    EmployeeId: currentUser.Id,
                    TravellerId: '0',
                    Type: '1'
                }
            }
        ];
        let isNeedApproval = (RcModel && (RcModel.CityLevelLimit || RcModel.StarRateLimit || RcModel.AdvanceDayLimit) && RcModel.ViolationMode === 2 || ViolationMode==2)?true:false
        // this.getTravellerUpdateCheck(PassengerList,ApproveOrigin,isNeedApproval,alertWarning,params,TravellerList);
        this._getApproveInfo(PassengerList,ApproveOrigin,isNeedApproval,alertWarning,params);
    }
    getTravellerUpdateCheck(PassengerList,ApproveOrigin,isNeedApproval,alertWarning,params,TravellerList) {
        const {shareAllArr} = this.state;
        const {roomModel} = this.params;
        let model = {
            OrderCategory: 4,
            Travellers: TravellerList
        }
        let Travellerarr = []
        let Travellerarr1 = []
        shareAllArr.forEach((item)=>{
            Travellerarr=item.map((item1)=>{
                let showName =  (item1.NationalCode == 'CN' || item1.NationalCode == 'HK' || item1.NationalCode == 'MO' || item1.NationalCode == 'TW' || !item1.NationalCode)
                return this._isVendorCodeTVP() || (!showName && !item1.selectCn) 
                ? 
                item1.Surname+"/"+item1.GivenName
                : item1.Name
            })
            let stringName = Travellerarr.join(',')
            Travellerarr1.push(
                '房间'+item?.[0]?.RoomNumber+"\n"+'入住人：'+stringName+"\n"+'入住人数：'+item.length+"\n\n"
            )
        })
        this.showLoadingView();
        CommonService.MassOrderTravellerUpdateCheck(model).then(response => {
            let massage =response.data? Util.Parse.isChinese() ? '订单提交后旅客信息会更新，请您及时通知旅客本人\n\n' : 'Passenger info will update after submission. Please notify the passenger promptly.\n\n' : '';
            let masseges = massage + Travellerarr1
            this.hideLoadingView();
            if (response && response.success) {
                this.showAlertView(masseges, () => {
                    return ViewUtil.getAlertButton('取消', () => {
                        this.dismissAlertView();
                    }, '确定', () => {
                        this.dismissAlertView(); 
                        this._getApproveInfo(PassengerList,ApproveOrigin,isNeedApproval,alertWarning,params);
                    })
                })
            } else {
                this._getApproveInfo(PassengerList,ApproveOrigin,isNeedApproval,alertWarning,params);
            }
        }).catch(error => {
            this.hideLoadingView();
            this._getApproveInfo(PassengerList,ApproveOrigin,isNeedApproval,alertWarning,params);
        });
    }

    _getApproveInfo(PassengerList,ApproveOrigin,isNeedApproval,alertWarning,params) {
        let approveInfo = {
            PassengerList: PassengerList,
            ApproveOrigin: ApproveOrigin,
            BusinessType: 7,
            IsNeedApproval: isNeedApproval,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
        }
        if (alertWarning != 1) {
            this.showLoadingView();
            CommonService.ApproveInfo(approveInfo).then(response => {
                this.hideLoadingView();
                if (response && response.success) {
                    params.ApproveList = response.data;
                    this._toNextJudge(params);
                } else {
                    this._toNextJudge(params);
                }

            }).catch(error => {
                this.hideLoadingView();
                this.toastMsg(error.message || '获取审批人信息失败');
            })
        }   
    }

    _toNextJudge = (params) => {
        const { customerInfo, userInfo } = this.state;
        this.push('HotelOrderSure', params);
    }
    _changeLiveday = (index) => {
        if (index === 0) {
            if (this.state.roomCount === 1) {
                this.toastMsg('最少入住1间');
                return;
            } else {
                this.state.roomCount--;
                this.state.travellers.splice(this.state.travellers.length - 1, 1);
            }
        } else {
            this.state.roomCount++;
            this.state.travellers.push([]);
        }
        this.setState({});
    }
    /**
     * 添加入住人
     */
    _addPerson = (data, index) => {
        const { isFirstTip, userInfo } = this.state;
        if (isFirstTip) {
            this.showAlertView('每个房间只需要填写1位入住人，如有同住人请点击“新增入住人”（同住人仅在账单中展示）,酒店办理入住时需提供第一位入住人的身份信息，所填姓名与入住时所持证件的姓名一致，否则酒店有权拒绝为您办理入住。', () => {
                return ViewUtil.getAlertButton('确定', () => {
                    this.dismissAlertView();
                    this.setState({
                        isFirstTip: false
                    }, () => {
                        this._addRoomOthers(data, index);
                    })
                })
            })
            return;
        }
        this.push('PassengerViewScreen', {
            title: index === 1 ? '选择其他员工' : '选择常用旅客',
            from: 'hotel',
            passengers: [],
            callBack: (passengers) => {
                passengers.forEach(obj => {
                    if (index === 2) {
                        obj.isTraveller = true;
                    }
                    data.push(obj);
                })
                this.setState({});
            }
        })
    }
    /**
     * 添加入住人 判断是否有权限添加
     */
    _addRoomOthers = (data, index) => {
        const { userInfo } = this.state;
        if ((userInfo.Permission & 3) === 3) {
            this._addPerson(data, index);
        } else if ((userInfo.Permission & 8) === 8) {
            if (index === 1) {
                this._addPerson(data, index);
            } else {
                this.toastMsg('没有为常旅客预订的权限');
            }
        } else {
            this.toastMsg('没有为员工和常旅客预订的权限');
        }
    }
    /**
     * 删除入住人
     */
    _deleteRoomLive = (data, index) => {

        data.splice(index, 1);
        this.setState({});
    }
    /**
     * 显示价格信息
     */
    _showPriceDetail = (totalPrice,merchantPrice,serviceP) => {
        const { customerInfo } = this.state;
        const { roomModel, RcModel } = this.params;
        // if (roomModel.PaymentType === 1) return null;
        // 1、支付方式 现付的话 担保？信用卡担保：前台现付       2、预付  担保？信用卡担保： SettleTypeDesc
        let paymentDesc = '';
        if (roomModel.PaymentType === 1) {
            if (roomModel.GuaranteeRules && roomModel.GuaranteeRules.length > 0) {
                paymentDesc = '信用卡担保';
            } else {
                paymentDesc = '前台现付';
            }
        }else if (roomModel.PaymentType === 2 && roomModel.NeedCreditCard) {
                paymentDesc = '信用卡预付';
                // SettleType = 6
        }else {
            paymentDesc = customerInfo.SettleTypeDesc;
        }
        this.setState({ 
            paymentDesc: paymentDesc,
            TotalPrice: totalPrice,
            merchantPrice: merchantPrice,
            serviceP:serviceP
         });
        if (this.state.showPriceDetail) {
            this.setState({
                showPriceDetail: false
            }, () => {
                this.priceView.hide();
            })
        } else {
            this.setState({
                showPriceDetail: true,
            }, () => {
                this.priceView.show();
            })
        }
    }

    _LeftTitleBtn(){
        this.pop();
    }

    renderBody() {
        const { Contact, ApproveOrigin, customerInfo, userInfo, 
                AdditionInfo, LasterLiveTime, ServiceFeesData, travellers,
                paymentDesc,HotelViolationMode1,HotelViolationMode2,SalfChooseApprovalOrSelfPay,
                ApplyTravelRule,CompanyPartPriceByMergerTravelRules,ServicePrice,TotalPrice,
                roomCount,fileList,merchantPrice,serviceP,PdfDictList } = this.state;
        const { feeType, hotelCanselRule, apply } = this.props;
        const {roomModel,SearchGuestNum} = this.params;
        let venderAlert = "该价格可积分。请在预定时填写会员号，并在入住时将会员信息提供给酒店，具体积分规则以酒店确认为准。";
        let noVenderAlert = "该价格须以会员身份入住才可积分。请在入住时将会员信息提供给酒店，具体积分规则以酒店确认为准。";
        return (
            <LinearGradient style={{ flex: 1, position: 'relative', }} start={{x: 1, y: 0}} end={{x: 1, y: 0.5}} colors={[Theme.theme,Theme.normalBg]}>
                {/* <View style={{flexDirection:'row',paddingHorizontal:15,justifyContent:'space-between',height:44,alignItems:'center'}}>
                    <TouchableOpacity onPress={()=>{this._LeftTitleBtn()}}>
                        <AntDesign name={'arrowleft'} size={20} color={'#fff'} />
                    </TouchableOpacity>
                    <CustomText text={'订单填写'} style={{fontSize:16, color:'#fff'}} />
                    <CustomText style={{fontSize:16, color:'#fff'}} text={''}></CustomText>
                </View> */}
                <AdContentInfoView adList={this.state.adList} detail_ad={true}/>
                <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    <HeaderView {...this.params} paramItems={this.paramItems} otwThis={this} userInfo={userInfo} hotelCanselRule={hotelCanselRule} />
                    {/* {this._renderSelectRoom()} */}
                    {
                        roomModel.IsRewardPoint?
                            <View style={{marginHorizontal:10,marginTop:10,backgroundColor:'#fff',padding:15,borderRadius:6}}>
                                <TitleView2 title={'积分规则'}></TitleView2>
                                <CustomText text={(roomModel.VendorCode==='TVP' || roomModel.SubChannel==='amadeus') ? venderAlert : noVenderAlert} style={{color:Theme.assistFontColor,marginTop:10}} ></CustomText>
                            </View>
                        :null
                    }
                    {
                        // roomCount < travellers.length ? 
                        // travellers.length < roomCount*SearchGuestNum?
                        //     this._renderTravellers2()
                        // : 
                        //     this._renderTravellers()
                        this._renderTravellers2()
                    }
                    <View style={styles.row}>
                        <CustomText text={Util.Parse.isChinese()?'预计到店':'Latest Arrival Time'} style={{fontSize:14}} />
                        <CustomText text={LasterLiveTime ? LasterLiveTime.format('yyyy-MM-dd HH:mm:ss') : '预计到店'} style={{ color: LasterLiveTime ? Theme.theme : "lightgray",fontSize:14 }} onPress={this._selectLaterDate} />
                    </View>
                    <ContactView
                        from={'hotel'}
                        model={Contact}
                    />
                    {
                    roomModel.PaymentType==1 && !roomModel.HasGuarantee?
                    <View style={{ backgroundColor: 'white', padding: 10,justifyContent:'space-between',marginHorizontal:10,borderRadius:6}}>
                        <CustomText text={'如您的到店时间晚于18:00，为保证您的房间，请联系酒店进行信用卡担保。未担保的预定，酒店有权根据当天入住情况取消未担保的酒店预定。'} style={{fontSize:11, color:'red'}} ></CustomText>
                    </View>:null
                    }
                    {SalfChooseApprovalOrSelfPay?
                       <View>
                            <View style={[styles.row1,{marginTop:10}]}>
                                    <CustomText text={'超标处理模式：'} style={{ }}numberOfLines={1} />
                            </View>
                            <TouchableOpacity style={styles.row1} onPress={()=>{this._checkClick1()}}>
                                    <CustomText text={'审批流程'} style={{ }}numberOfLines={1} />
                                    <AntDesign name={'checksquare'} size={22} color={HotelViolationMode1?Theme.theme:'#ddd'} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.row1} onPress={()=>{this._checkClick2()}}>
                                    <CustomText text={'自付流程'} style={{ }}numberOfLines={1} />
                                    <AntDesign name={'checksquare'} size={22} color={HotelViolationMode2?Theme.theme:'#ddd'} />
                            </TouchableOpacity>
                        </View>:null
                    }
                    {
                        feeType === 1 ?
                            <View>
                                {/* <DepartView
                                    ApproveOrigin={ApproveOrigin}
                                    customerInfo={customerInfo}
                                /> */}
                                <AdditionInfoView
                                    customerInfo={customerInfo}
                                    userInfo={userInfo}
                                    AdditionIfo={AdditionInfo}
                                    ApproveOrigin={ApproveOrigin}
                                    fromNo={4}//国内酒店  BusinessCategory
                                    PdfDictList={fileList&&fileList.length>0 ? PdfDictList :null}
                                />
                                {this._renderPayType()}
                            </View>
                            : null
                    }
                    {
                        customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.HotelContainsAttachment//判断上传附件是否展示
                        ?
                        <View style={{marginTop:10,backgroundColor:'#fff', paddingHorizontal: 20,marginHorizontal:10,paddingVertical:10,borderRadius:6,marginBottom:10}}>
                             <TouchableOpacity  style={{ flexDirection:'row',alignItems:'center', backgroundColor:'#fff' , borderColor: Theme.lineColor, borderBottomWidth:1,justifyContent: "space-between",flexWrap:'wrap'}}
                                                onPress={()=>{this._selectFile()}}>
                                    {
                                        customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.HotelNecessary?
                                        <TitleView2 title={'上传附件'} required={true}></TitleView2>
                                        :
                                        <TitleView2 title={'上传附件'}></TitleView2>
                                    }
                                    {/* <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} style={{ marginLeft: 5 }} /> */}
                                    <View style={{flexDirection: 'row', alignItems: 'center',paddingVertical:10 }}>
                                        <TouchableOpacity style={[{ borderColor: Theme.theme }, styles.borderAll]} 
                                            onPress={()=>{
                                                this._selectFile()
                                            }}
                                        >
                                            <CustomText text='从文件夹上传' style={{color: Theme.theme }} />
                                        </TouchableOpacity>
                                        {
                                        Platform.OS === 'android'?null:
                                        <TouchableOpacity style={[{ borderColor: Theme.theme,marginLeft:5 }, styles.borderAll]} 
                                            onPress={()=>{
                                            this._selectImage()
                                            }}
                                        >
                                            <CustomText text='打开相册或相机' style={{color: Theme.theme }} />
                                        </TouchableOpacity>}
                                    </View>
                            </TouchableOpacity>
                            <View style={{ backgroundColor: 'white',justifyContent:'space-between',}}>
                                    <CustomText text={'单个文件最大5MB，数量最多5个，格式为:'} style={{fontSize:11, color:'red'}} ></CustomText>
                                    <CustomText text={'jpg,png,jpeg,bmp,gif,xlsx,xls,txt,doc,docx,md,pdf,ppt,pptx,wps;'} style={{fontSize:11, color:'red'}}></CustomText>                                  
                            </View>
                        </View>
                        :null
                    }
                    {
                       fileList&&fileList.map((item,index)=>{
                            return(
                                <View style={{ flexDirection: 'row', height: 44, flex:1, alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 20,justifyContent:'space-between',marginHorizontal:10,borderRadius:4}}>
                                    <CustomText text={item.FileName} style={{flex:3}}></CustomText>                 
                                    <AntDesign name={'delete'} onPress={()=>{
                                        fileList?.splice(index,1);
                                        this.setState({})
                                    }} size={26} color={Theme.theme} />
                                </View>  
                            )
                        })
                    }

                </KeyboardAwareScrollView>
                <CreateOrderPriceView ref={o => this.priceView = o} {...this.params} 
                               ServiceFeesData={ServiceFeesData} 
                               roomCount={this.state.roomCount} 
                               travellers={travellers} 
                               paymentDesc={paymentDesc}
                               ApplyTravelRule = {ApplyTravelRule}
                               CompanyPartPriceByMergerTravelRules = {CompanyPartPriceByMergerTravelRules} 
                               ServicePrice = { ServicePrice }
                               totalPrice = {TotalPrice}
                               merchantPrice={merchantPrice}
                               serviceP = { serviceP }
                               callBack={()=>{
                                this._showPriceDetail();
                               }}
                />
                {this._renderBottomView()}
            </LinearGradient>
        )
    }
    /**
     * 选择文件方法
     */
 
    _selectFile=()=>{
        const {fileList,AdditionInfo,customerInfo} = this.state;
        if(fileList.length>4){
            this.toastMsg('最多只能上传5个文件')
            return;
        }
        OpenGetFile.getFile(this).then(response => {
            fileList.push(response);
            this.setState({
                fileList:fileList
            },()=>{
                if(customerInfo.Setting.IsPdfAnalyze){
                    let model={
                        PdfUrl:response.Url,
                        orderCategory:CommonEnum.CategogryId.hotel,
                        ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
                    }
                    CommonService.AnalyzePdfDictionary(model).then(response => {
                        if (response && response.success && response.data) {
                            if (customerInfo.DictList) {
                                for (let i = 0; i < customerInfo.DictList.length; i++) {
                                    const obj = customerInfo.DictList[i];
                                    let itemIndex2 = response.data&&response.data.find(item => item.DictName == obj.Name);
                                    if(itemIndex2){
                                        itemIndex2.DictName = obj.Name
                                        itemIndex2.DictEnName = obj.EnName
                                        itemIndex2.ItemInput = itemIndex2.Value
                                        itemIndex2.ItemName = itemIndex2.Value
                                        itemIndex2.ItemEnName = itemIndex2.Value
                                        itemIndex2.Id = obj.Id
                                        itemIndex2.DictId = obj.Id
                                        itemIndex2.DictCode = obj.Code
                                        itemIndex2.NeedInput = obj.NeedInput
                                        itemIndex2.Sort = obj.Sort
                                        itemIndex2.Remark = obj.Remark
                                        itemIndex2.EnRemark = obj.EnRemark
                                        itemIndex2.ShowInOrder = obj.ShowInOrder
                                        itemIndex2.BusinessCategory = obj.BusinessCategory
                                    }
                                    if(itemIndex2){
                                        let itemIndex = AdditionInfo&&AdditionInfo.DictItemList.find(item => item.DictName == itemIndex2.DictName);
                                        if(itemIndex){
                                            AdditionInfo&&AdditionInfo.DictItemList.splice(itemIndex,1);
                                            AdditionInfo&&AdditionInfo.DictItemList.push(itemIndex2);
                                        }else{
                                            AdditionInfo&&AdditionInfo.DictItemList.push(itemIndex2);
                                        }
                                    }
                                }
                            }
                            this.setState({
                                PdfDictList:response.data,
                                AdditionInfo
                            })
                        }
                    }).catch(error => {
            
                    })
                }
            })
        })
    }

    _selectImage=()=>{
        const {fileList} = this.state;
        if(fileList&&fileList.length>4){
            this.toastMsg('最多只能上传5个文件')
            return;
        }
        OpenGetPic.getFile(this).then(response => {
            response.data[0].FileName =  response.data[0].Name
            fileList.push(response.data[0]);
            this.setState({
                fileList:fileList,
                ImageInfo: response.imageInfo
            })
        })
    }

    _checkClick1 = () =>{
        this.setState({
            HotelViolationMode1:true,
            HotelViolationMode2:false
        })
    }
    _checkClick2 = () =>{
        this.setState({
            HotelViolationMode1:false,
            HotelViolationMode2:true
        })
    }
   // 选择房间
    _renderSelectRoom = () => {
        const {CompanyPartPriceByMergerTravelRules} = this.state;
        return (
            CompanyPartPriceByMergerTravelRules>0?null:
            <View style={{ backgroundColor: 'white', height: 40, flexDirection: 'row', justifyContent: "space-between", alignItems: 'center', borderBottomColor: Theme.lineColor, borderBottomWidth: 1 }}>
                <TouchableHighlight underlayColor='transparent' style={{ marginLeft: 5 }} onPress={this._changeLiveday.bind(this, 0)}>
                    <AntDesign name={'minus'} size={40} color={'lightgray'} />
                </TouchableHighlight>
                <Text allowFontScaling={false} style={{ fontSize: 15 }}>{I18nUtil.translate('住') + ' ' + this.state.roomCount + ' ' + I18nUtil.translate('间')}</Text>
                <TouchableHighlight underlayColor='transparent' style={{ marginRight: 10 }} onPress={this._changeLiveday.bind(this, 1)}>
                    <Ionicons name={'ios-add'} size={45} color={'lightgray'} />
                </TouchableHighlight>
            </View>
        )
    }


    //付款方式
    _renderPayType = () => {
        const { customerInfo } = this.state;
        const { roomModel, RcModel } = this.params;
        // if (roomModel.PaymentType === 1) return null;
        // 1、支付方式 现付的话 担保？信用卡担保：前台现付       2、预付  担保？信用卡担保： SettleTypeDesc

        let paymentDesc = '';
        if (roomModel.PaymentType === 1) {
            if (roomModel.GuaranteeRules && roomModel.GuaranteeRules.length > 0) {
                paymentDesc = '信用卡担保';
            } else {
                paymentDesc = '前台现付';
            }
        }else if (roomModel.PaymentType === 2 && roomModel.NeedCreditCard) {
                paymentDesc = '信用卡预付';
                // SettleType = 6
        }else {
            if (roomModel.GuaranteeRules && roomModel.GuaranteeRules.length > 0) {
                paymentDesc = '信用卡担保';
            } else {
                paymentDesc = customerInfo.SettleTypeDesc;
            }
        }


        return (
            <View style={{ marginTop: 10, backgroundColor: 'white', padding: 20, flexDirection: 'row',marginHorizontal: 10,borderRadius:4,justifyContent:'space-between',  }}>
                <View style={{ flexDirection: 'row' }}>
                    <CustomText text='支付方式'style={{fontSize:14}} />
                    <CustomText text={':'} />
                </View>
                <View style={{ flexDirection: 'row',flexWrap:'wrap' }}>
                    <CustomText text={paymentDesc} style={{fontSize:14}}/>
                    <CustomText text={' '} />
                    <CustomText text={(RcModel && RcModel.ViolationMode == 3 ? '超标现付' : '')} style={{fontSize:14}} />
                </View>
            </View>
        )
    }

    _deleteSharePerson=(item,i,index1)=>{
        const {shareAllArr,travellers} = this.state;
        travellers&&travellers.map((item,index)=>{
            if(item.Name === shareAllArr[i][index1].Name){
                item.shareRoomSelect = false
            }
        })
        shareAllArr[i].splice(index1,1);
        this.setState({},()=>{ })
    }

    _clickChoosePerson=(index)=>{
        const { travellers , shareAllArr} = this.state;
        // if(shareAllArr[index].length>1){
        //    this.toastMsg('一间房最多住两人');
        //    return
        // }
        let falseArr = [];
        travellers&&travellers.map((item)=>{
            if(!item.shareRoomSelect){
                falseArr.push(item);
            }
        })
        if( falseArr.length==0 ){
            if(shareAllArr&&shareAllArr?.[index]?.length>0){
                this.toastMsg('每间房至少有一位出行人，如果出行人已选完，可删除重新选择');
            }else{
                this.toastMsg('入住人已选完，可删除重新选择'); 
            }
            return;
        }
        this.push('ChooseLivePersonScreen',{
            travellers:travellers,
            shareSingleArr:shareAllArr[index],
            shareCallBack:(travellers,backSingleArr)=>{
                if(backSingleArr && backSingleArr.length>0){
                    backSingleArr.map((item,index)=>{
                        if(index === 1){
                            item.SeqNo = 2
                        }
                    })
                    //backSingleArr里的item重新排序，item.Id存在的排在第一个
                    backSingleArr.sort((a, b) => {
                        return a.Id ? -1 : 1;
                    });
                }
                shareAllArr[index] = backSingleArr            
                this.setState({
                    travellers:travellers,
                    shareAllArr:shareAllArr
                },()=>{
                    this.props.setHotelShareArr(shareAllArr);
                })
            }
        });
       
    }

    _renderTravellers2 = () => {
        const { roomCount,shareAllArr,travellers } = this.state;
        const {roomModel,SearchGuestNum} = this.params;
        let roomNumList = [];
        for(let i=0; i<roomCount; ++i){
            roomNumList.push(i);
        }
        let falseArr = [];
        travellers && travellers.length>1 && travellers.map((item)=>{
            if(!item.shareRoomSelect){
                falseArr.push(item);
            }
        })
        
        return(
            <View>
                 {
                    roomNumList&&roomNumList.map((i)=>{
                        return(
                            <View style={{ flexDirection: 'row', backgroundCoor: 'white', borderBottomColor: Theme.lineColor, borderBottomWidth: 1, backgroundColor:'#fff',marginHorizontal:10,borderRadius:6,marginTop:10}} >
                                <View style={{ justifyContent: 'center' }}>
                                    <TextViewTitle title={'入住信息'} style={{marginLeft:20}} imgIcon={require('../../res/Uimage/hotelhome.png')} from={'_hotel'}/>
                                    <View style={{flexDirection:'row',marginLeft:10}}>
                                        <Text style={{ padding: 10, color:Theme.fontColor }}>{I18nUtil.translate('房间')}{parseInt(i) + 1}</Text>
                                        {/* <Text style={{ padding: 10, color:Theme.theme }}>{I18nUtil.translate('添加入住人')}</Text> */}
                                        {
                                        // SearchGuestNum*roomCount === travellers?.length || shareAllArr&&shareAllArr[i].length>1 ? null:
                                            <TouchableOpacity onPress={()=>{falseArr.length==0 && shareAllArr&&shareAllArr?.[i]?.[0]?.PassengerOrigin?.EmployeeId ? this._addSharePerson(i) : this._clickChoosePerson(i)}}>
                                            { 
                                                falseArr.length==0 ?
                                                    shareAllArr?.[i]?.length<SearchGuestNum ?
                                                    <Text style={{ padding: 10, color:Theme.theme }}>{I18nUtil.translate('添加入住人')}</Text> : null
                                                :
                                                <Text style={{ padding: 10, color:Theme.theme }}>{I18nUtil.translate('添加入住人')}</Text>
                                            }
                                            </TouchableOpacity>
                                        }
                                    </View>
                                    {
                                        shareAllArr&&shareAllArr[i]&&shareAllArr[i].map((item,index)=>{
                                           let showName =  (item.NationalCode == 'CN' || item.NationalCode == 'HK' || item.NationalCode == 'MO' || item.NationalCode == 'TW' || !item.NationalCode)
                                           item.RoomNumber = i+1;
                                           return (
                                              <TouchableOpacity style={{flexDirection: 'row',width:global.screenWidth-60,marginLeft:20,alignItems:'center',justifyContent:'space-between'}} onPress={()=>{this._toClickEdit(item,i,index)}}>
                                                <View style={{flexDirection:'row',alignItems:'center'}}>
                                                    <TouchableHighlight onPress={()=>{this._deleteSharePerson(item,i,index)}} style={{ }} underlayColor='transparent'>
                                                        <AntDesign name={'delete'} size={20} color={Theme.theme} />
                                                    </TouchableHighlight>
                                                        {
                                                             this._isVendorCodeTVP() || !showName || (!item.selectCn && item.IsTempCustomer)?
                                                                <View style={{flexDirection:'column'}}> 
                                                                    <View style={{flexDirection:'row',alignItems:'center'}}>      
                                                                        <CustomText text={'英文名' } />
                                                                        <CustomText text={'*'} style={{  color:'red',fontSize:24,marginLeft:2}} />
                                                                        <CustomText text={'：' } />
                                                                        <CustomText text={item.GivenName?item.GivenName:'请填写英文名'} style={{color:item.GivenName?'black':Theme.darkColor}} />
                                                                    </View> 
                                                                    <View style={{flexDirection:'row',alignItems:'center'}}>      
                                                                        <CustomText text={'英文姓' } />
                                                                        <CustomText text={'*'} style={{  color:'red',fontSize:24,marginLeft:2}} />
                                                                        <CustomText text={'：' } />
                                                                        <CustomText text={item.Surname?item.Surname:'请填写英文姓'} style={{color:item.Surname?'black':Theme.darkColor}}/>
                                                                    </View>
                                                                </View> 
                                                            :<CustomText text={item.Name} style={{paddingVertical:6}}/>
                                                        }
                                                 </View>
                                                    <Ionicons name={'ios-arrow-forward'} size={20} color={'lightgray'} />
                                              </TouchableOpacity>
                                              
                                           )
                                        })
                                    }
                                 </View>
                            </View>
                        )
                    })
                 }
            </View>
        )
    }

    _isVendorCodeTVP = () => {
        const { roomModel } = this.params;
        return (
            ((roomModel.Channel === 'sohoto'|| roomModel.SubChannel === 'sohoto') && 
             ['TVP', 'BK', 'QIUGUO', 'QIUGUOS'].includes(roomModel?.VendorCode)) || 
            roomModel.SubChannel === 'amadeus'
        );
    }

    _toClickEdit = (data,j,index) => {
        const {  customerInfo,travellers,shareAllArr } = this.state;
        const { roomModel } = this.params;
        if (!data.AdditionInfo) {
            data.AdditionInfo = data.AdditionDict
        }
        if(data.IsTempCustomer){
            this.push('HotelAddPersonEditScreen',{
                passenger: data,
                VendorCodeTVP: this._isVendorCodeTVP(),
                callBack:(reason, i)=>{
                    shareAllArr[j][index] = reason
                    this.setState({
                        shareAllArr:shareAllArr,
                    })
                }
            })
        }else{
            this.push('HotelEditPassengerScreen', {
                customerInfo: customerInfo,
                passenger: data,
                IsNeedIDCard: roomModel.IsNeedIDCard,
                noComp:true,//判断不是综合订单
                IsRewardPointTVP:roomModel.IsRewardPoint && (roomModel.VendorCode==='TVP' || roomModel.SubChannel==='amadeus'),
                VendorCodeTVP: this._isVendorCodeTVP(),
                callBack: (reason, i) => {
                    travellers&&travellers.map((item,indexx)=>{
                        if(item.Id === reason.Id){
                            travellers[indexx] = reason
                        }
                    })
                    shareAllArr[j][index] = reason
                    this.setState({
                        travellers:travellers,
                        shareAllArr:shareAllArr,
                    })
                    // data = reason
                    data.CertificateNumber = i
                    data.CertificateType = '身份证'
                    data.CertificateId = 1
                }
            })
        }
        
    }

    _renderTravellers = () => {
        const { travellers,CompanyPartPriceByMergerTravelRules,NewReasons, } = this.state;
        return (
            CompanyPartPriceByMergerTravelRules>0?
            <View style={{flexDirection: 'row', backgroundColor:'#fff'}}>
               <View style={{ justifyContent: 'center' }}>
                    <Text style={{ padding: 10 }}>{I18nUtil.translate('房间')}{1}</Text>
               </View>
               {
                 <View style={{marginLeft:10}}>
                {
                    travellers&&travellers.map((item, index) => {
                        return (
                            this._abloutLiveNumber(item)
                        )
                    })
                }
                 </View>
               }
            </View>
            :
            <View style={{ marginHorizontal: 10, backgroundColor: "white",borderRadius:6,paddingHorizontal:10,marginTop:10 }}>
                {
                    travellers&&travellers.map((item, index) => {
                        return (
                            <View key={index} style={{marginHorizontal:10,paddingTop:10}}>
                                <View style={{ backgroundColor: 'white', borderBottomColor: Theme.lineColor, borderBottomWidth: 1 }}>
                                    <View style={{ justifyContent: 'center' }}>
                                        <Text style={{  }}>{I18nUtil.translate('房间')}{parseInt(index) + 1}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        {
                                            this._abloutLiveNumber(item)
                                        }
                                    </View>
                                </View>
                                {/* <View style={{ backgroundColor: 'white', padding: 15, paddingLeft: 10, justifyContent: 'space-between', borderBottomColor: Theme.lineColor, borderBottomWidth: 0.5 }}>
                                    <CustomText style={{ color: Theme.theme }} text='新增入住人（员工）' onPress={this._addRoomOthers.bind(this, item, 1)} />
                                </View>
                                <View style={{ backgroundColor: 'white', padding: 15, paddingLeft: 10, justifyContent: 'space-between' }}>
                                    <CustomText style={{ color: Theme.theme }} text={'新增入住人（常旅客）'} onPress={this._addRoomOthers.bind(this, item, 2)} />
                                </View> */}
                            </View>
                        )
                    })
                }
            </View>
        )
    }

    _addSharePerson = (index) => {
        const { travellers , shareAllArr} = this.state;
        let obj = {Name:null, Mobile:null,Email:null,NationalCode:null,NationalName:null,IsTempCustomer:true,Phone:null,SeqNo:9}
        const { roomModel } = this.params;
        this.push('HotelAddPersonEditScreen',{
            passenger: obj,
            VendorCodeTVP: this._isVendorCodeTVP(),
            callBack:(reason, i)=>{
                shareAllArr[index].push(reason);
                this.setState({
                    shareAllArr:shareAllArr,
                })
            }
        })
    }

    _abloutLiveNumber = (data) => {
        const { roomModel } = this.params;
        const {  customerInfo,travellers } = this.state;
        if (!data.AdditionInfo) {
            data.AdditionInfo = data.AdditionDict
        }
        let showName =  (data.NationalCode == 'CN' || data.NationalCode == 'HK' || data.NationalCode == 'MO' || data.NationalCode == 'TW' || !data.NationalCode)
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
                {
                    <TouchableOpacity
                        onPress={() => {
                            this.push('HotelEditPassengerScreen', {
                                customerInfo: customerInfo,
                                passenger: data,
                                //IsRewardPoint:roomModel.IsRewardPoint,
                                IsRewardPointTVP:roomModel.IsRewardPoint &&(roomModel.VendorCode==='TVP' || roomModel.SubChannel==='amadeus'),
                                //当供应商为'TVP'/ 'BK'/ 'QIUGUO'/ 'QIUGUOS'时，用英文姓名下单
                                VendorCodeTVP: this._isVendorCodeTVP(),
                                IsNeedIDCard: roomModel.IsNeedIDCard,
                                noComp:true,//判断不是综合订单
                                callBack: (reason, i) => {
                                    travellers&&travellers.map((item,indexx)=>{
                                        if(item.Name === reason.Name){
                                            travellers[indexx] = reason
                                        }
                                    })
                                    this.setState({})
                                    data = reason
                                    data.CertificateNumber = i
                                    data.CertificateType = '身份证'
                                    data.CertificateId = 1
                                }
                            })
                        }}
                        style={{flexDirection:'row',width:screenWidth-65, alignItems: 'center'}}>
                        {
                            (this._isVendorCodeTVP()||(!showName && !data.selectCn))?
                                <View style={{flexDirection:'column'}}> 
                                    <View style={{flexDirection:'row',alignItems:'center'}}>      
                                        <CustomText text={'英文名' } />
                                        <CustomText text={'*'} style={{  color:'red',fontSize:24,marginLeft:2}} />
                                        <CustomText text={'：' } />
                                        <CustomText text={data.GivenName?data.GivenName:'请填写英文名'} style={{color:data.GivenName?'black':Theme.darkColor}} />
                                    </View> 
                                    <View style={{flexDirection:'row',alignItems:'center'}}>      
                                        <CustomText text={'英文姓' } />
                                        <CustomText text={'*'} style={{  color:'red',fontSize:24,marginLeft:2}} />
                                        <CustomText text={'：' } />
                                        <CustomText text={data.Surname?data.Surname:'请填写英文姓'} style={{color:data.Surname?'black':Theme.darkColor}}/>
                                    </View>
                                </View> 
                            :<CustomText text={data.Name} style={{paddingVertical:3}}/>
                        }
                        <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                            <Ionicons name={'ios-arrow-forward'} size={20} color={'lightgray'} />
                        </View>
                    </TouchableOpacity>
                }
            </View>
        )
    }
    _renderBottomView = () => {
        const { showPriceDetail, ServiceFeesData, roomCount, travellers,customerInfo,ApplyTravelRule,CompanyPartPriceByMergerTravelRules,ServicePrice } = this.state;
        const {roomModel,liveDay, RcModel } = this.params
        var serviceFee = 0;
        var VipServiceFee = 0;
        var servicePrice = 0;
        let vip = 0;
        let pub = 0;
        let needCreditCard = false;
        var personList = [];
        if(roomModel.NeedCreditCard){//信用卡模式用现付模式支付
            needCreditCard = true;
        }
        let totalPrice = roomModel.AvgPrice * liveDay * roomCount;
        const beforTotal = totalPrice //记录不包含服务费的总价
        travellers && travellers.forEach((item) => {
            if (item.IsVip) {
                vip++;
            } else {
                pub++;
            }
        })
        ServiceFeesData && ServiceFeesData.ServiceFees && ServiceFeesData.ServiceFees.map((item) => {//非VIP
            if (item.FeeValueType == 1) {
                serviceFee += Number(item.Price);
            }
            else if (item.FeeValueType == 2) {
                item.Price = Number((item.FeeValue * roomModel.AvgPrice * liveDay).toFixed(2));
                serviceFee += item.Price;
            }
        })
        ServiceFeesData && ServiceFeesData.VipServiceFees && ServiceFeesData.VipServiceFees.map((item) => {//VIP
            if (item.FeeValueType == 1) {
                VipServiceFee += Number(item.Price);
            }
            else if (item.FeeValueType == 2) {
                item.Price = Number((item.FeeValue * roomModel.AvgPrice * liveDay).toFixed(2));
                VipServiceFee += item.Price;
            }
        })

        if (ServiceFeesData.TollType === 1) {//按夜间收
            if (vip > 0) {
                servicePrice = VipServiceFee * liveDay * roomCount
            } else {
                servicePrice = serviceFee * liveDay * roomCount
            }
        } else if (ServiceFeesData.TollType === 2) {//按订单收取
            if (vip > 0) {
                servicePrice = VipServiceFee
            } else {
                servicePrice = serviceFee
            }
        } else if (ServiceFeesData.TollType === 3) {//按房间收取
            if (vip > 0) {
                servicePrice = VipServiceFee * roomCount
            } else {
                servicePrice = serviceFee * roomCount
            }
        }
        totalPrice = (ServiceFeesData && ServiceFeesData.IsShowServiceFee || this.props.feeType === 2) ? totalPrice + servicePrice : totalPrice
        
        /**个人超标现付 */ 
        let peronalCost = 0;//个人超标现付
        let PriceLimit = 0;
        if (RcModel){
            PriceLimit = parseFloat(RcModel&&RcModel.PriceLimit);
        }
        if(ApplyTravelRule){
            if(CompanyPartPriceByMergerTravelRules && CompanyPartPriceByMergerTravelRules>0){
                peronalCost = (parseFloat(roomModel.TotalPrice) - CompanyPartPriceByMergerTravelRules * liveDay) * roomCount < 0 ?
                0 : (parseFloat(roomModel.TotalPrice) - CompanyPartPriceByMergerTravelRules * liveDay) * roomCount;
            }else{
                const { IsUsedApplyBudget, RestApplyBudget, ViolationMode } = ApplyTravelRule;
                if(IsUsedApplyBudget && ViolationMode == 3){
                    let price = ((parseFloat(roomModel.AvgPrice) - PriceLimit) * liveDay * roomCount);
                    peronalCost = price>RestApplyBudget? price - RestApplyBudget : 0;
                }
                //前台现付不计算公司或个人金额
                else if ( parseFloat(roomModel.AvgPrice) > PriceLimit &&  RcModel && (RcModel.CityLevelLimit || RcModel.StarRateLimit || RcModel.AdvanceDayLimit) && (ViolationMode == 3 || ViolationMode == 4)) {
                    peronalCost = (parseFloat(roomModel.AvgPrice) - PriceLimit) * liveDay * roomCount; 
                }
            }
        }else{
                if (RcModel && (RcModel.ViolationMode == 3||RcModel.ViolationMode == 4) && roomModel.TotalPrice > PriceLimit) {
                    peronalCost = (parseFloat(roomModel.TotalPrice) - (PriceLimit * liveDay)) * roomCount;
                }
        }        

        /**刷卡手续费计算 */
        let serviceP = totalPrice - beforTotal //用包含服务费的总价减去不包含服务费的总价
        let price = roomModel.PaymentType === 1 || roomModel.NeedCreditCard ? 0 : beforTotal//前台现付总价传0
        let merchantPrice =ServiceFeesData?.IsShowServiceFee ? MerchantPriceUtil.merchantPrice( CommonEnum.orderIdentification.hotel, customerInfo, price, serviceP, peronalCost,this.props.feeType,needCreditCard) : 0
        let servivePs= serviceP+merchantPrice
        totalPrice = (totalPrice + merchantPrice).toFixed(2) == 'NaN' ? '--' : (totalPrice + merchantPrice).toFixed(2)
        return (
            <View style={{ height: 50, flexDirection: 'row', backgroundColor: 'white', alignItems: 'center', borderTopWidth: 1, borderColor: Theme.lineColor }}>
                <CustomText style={{ marginLeft: 10, color: Theme.theme, fontSize: 17, fontWeight: 'bold' }} text={'¥' + totalPrice} />
                <View style={{ flex: 1, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableHighlight underlayColor='transparent' onPress={()=>{this._showPriceDetail(totalPrice,merchantPrice,servivePs)}}>
                        <View style={{ flexDirection: "row", flex: 1, justifyContent: "flex-end", alignItems: "center", height: 50 }}>
                            <CustomText style={{ fontSize: 13, color: 'gray' }} text='明细' />
                            <Ionicons name={showPriceDetail ? 'ios-arrow-up' : 'ios-arrow-down'} size={16} color={'gray'} style={{ marginRight: 5 }} />
                        </View>
                    </TouchableHighlight>
                    <TouchableHighlight underlayColor='transparent' onPress={() => { this._orderBtnClick(totalPrice) }}>
                        <View style={styles.bottom_btn}>
                            <CustomText style={{ color: 'white' }} text='下一步' />
                        </View>
                    </TouchableHighlight>
                </View>
            </View >
        )
    }
}
const getStatePorps = state => ({
    feeType: state.feeType.feeType,
    apply: state.apply.apply,
    hotelCanselRule: state.hotelCanselRule.value,
    comp_userInfo: state.comp_userInfo,
    shareAllArr: state.hotel_shareArr.shareAllArr
})
const mapDispatchToProps = dispatch =>({
    setHotelShareArr:(shareAllArr)=>dispatch(action.setHotelShareArr(shareAllArr)),
})
export default connect(getStatePorps,mapDispatchToProps)(HotelCreateOrderScreen);


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
        width: 120,
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Theme.theme,
        marginRight:10,
        borderRadius:2,
    },
    row: {
        backgroundColor: 'white',
        height: 50,
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginHorizontal:10,
        // marginTop:10,
        borderRadius: 4,
        justifyContent:'space-between'
    },
    row1: {
        backgroundColor: 'white',
        height: 44,
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        justifyContent:'space-between',
    },
    alertStyle: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
    },
    borderAll: {
        // width: 60,
        height: 25,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: "center",
        borderRadius: 3,
        paddingHorizontal:3
    }
})
