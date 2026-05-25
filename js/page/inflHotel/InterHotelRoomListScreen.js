// import React from 'react';
import React, {useState} from 'react';
import {
    View,
    Image,
    Text,
    Linking,
    TouchableHighlight,
    ActivityIndicator,
    SectionList,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ImageBackground,
    StyleSheet,
    Dimensions,
    Animated,
    ScrollView,
    Modal
} from 'react-native';
import SuperView from '../../super/SuperView';
import Theme from '../../res/styles/Theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import CustomText from '../../custom/CustomText';
import ViewUtil from '../../util/ViewUtil';
import I18nUtil from '../../util/I18nUtil';
import HotelService from '../../service/HotelService';
import CommonService from '../../service/CommonService'
import TitleSwitchView from '../common/TitleSwitchView';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import UserInfoDao from '../../service/UserInfoDao';
import Swiper from 'react-native-swiper';
import Util from '../../util/Util';
import Popover , { PopoverPlacement }from 'react-native-popover-view';
import {connect} from 'react-redux';
import Key from '../../res/styles/Key';
import CryptoJS from "react-native-crypto-js";//加密、解密
import action from '../../redux/action';
import HTMLView from 'react-native-htmlview';
import Pop from 'rn-global-modal';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import RenderHtml from 'react-native-render-html';

const screenWidth = Dimensions.get('screen').width;
const screenHeight = Dimensions.get('screen').height;
let _this;
class InterHotelRoomListScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '酒店详情'
        }
        this._tabBarBottomView = {
            bottomInset: true,
        }
        this.state = {
            roomList: [],
            roomListArrs:[],
            roomTypeList: [],
            isLoading: true,
            selectDate: this.params.selectDate,
            longDay: this.params.longDay,
            RoomCount: this.params.roomCount,
            LimitPrice: null,
            ViolationMode: null,
            roomDetail: null,
            imageArrs:[],
            itemData:[],
            groupName:'',
            itemWindow:'',//房间是否有窗
            itemDescription:'',//房间描述
            itemArea:'',//房间面积
            itemFloor:'',//楼层
            itemBroadnetType:'',//wifi类型
            securetyTipViewY: new Animated.Value(screenHeight),
            selectEligibility:false,//是否符合差标
            selectBreakfast:false,//是否有早餐
            selectAgreement:this.params.IsCustomerAgreement,//是否协议价
            selectPaytype:0,//0不限，1预付，2到付
            selectBedtype:0,//0不限，1大床房，2双床
            paySwich: this.params.paymentArrival?'到付':this.params.paymentAdvance?"预付":"",
            bedSwich:false,
            OnOff:false,//是否显示列表底部
            StarRateLimit:false,  //判断星级超标
            StarRateViolationMode:false, //判断星级超标是否可预订
            ViolationModeCity:false,
            customerInfo:{},
            isOnlyApply:false,//是否只支持申请单预订
            ShareRoomApplyFlag:false,
            alertShow:false,
            PlanPriceCheckData:null,
            sectionData:{},
            BigPriceData:null,
            isBlink:false,
            AdvanceDayLimit:false,
            AdvanceDayViolationMode:false,
            isVisible:false,
            isVisible2:false,
            bedTypeGroup:[],
        }    
           _this = this;
    }
    //展示详情弹出View
  _showTipView = (sectionArr,data,groupName) => {
      sectionArr.forEach(function(item){
        if(item.HotelCode===data.HotelCode && item.RoomTypeCode ===data.RoomTypeCode){
            _this.setState({
                imageArr:item.RoomImageList,//房间图片
                itemWindow: item.WindowType==7?'':item.WindowTypeDesc,//房间是否有窗
                itemDescription:item.Desc,//房间描述
                itemArea:item.Area,
                itemFloor:item.Floor,
                itemBroadnetType:item.BroadnetType

            })
        }
        _this.setState({
            itemData:data,
            groupName:groupName,
        })
    }),
    Animated.timing(
      this.state.securetyTipViewY,
      {
        toValue: screenHeight - screenHeight - 64,
        duration: 200,   //动画时长300毫秒
      }
    ).start();
  }
 

  //隐藏详情弹出view
  _hiddenTipView = () => {
    Animated.timing(
      this.state.securetyTipViewY,
      {
        toValue: screenHeight,
        duration: 30,   //动画时长300毫秒
      }).start();
  }

  componentDidMount() {
      const{ customerInfo_userInfo,apply,compSwitch } = this.props;
      this._loadList();
      this.setState({
        roomListArrs:this.state.roomList
      })
        let referencEmployeeId
        if(this.props.comp_userInfo&&this.props.comp_userInfo.employees&&this.props.comp_userInfo.employees.length>0){
            let num = this.props.comp_userInfo&&this.props.comp_userInfo.employees.length-1
            referencEmployeeId = this.props.comp_userInfo.employees[num]&&this.props.comp_userInfo.employees[num].PassengerOrigin&&this.props.comp_userInfo.employees[num].PassengerOrigin.EmployeeId
        }else{
            referencEmployeeId = customerInfo_userInfo.userInfo.Id
        }
        let model={
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:referencEmployeeId,
        }
      CommonService.customerInfo(model).then(response => {
        if (response && response.success) { 
            let isApply = response.data.Setting&&response.data.Setting.HotelTravelApplyConfig
            if(isApply){
                if(isApply.IsOnlyApply && !customerInfo_userInfo.userInfo.NoNeedApply && !apply){
                    this.setState({
                        isOnlyApply:true
                    })
                }
            }   
            this.setState({
                customerInfo:response.data,
            })
        } 
    })
  }
    
   getHotelShare(){//判断合住
        const { apply } = this.props;
        const { everyPerNum,roomCount } = this.params
        let travellersNum = roomCount * everyPerNum
        if(apply&&apply.selectApplyItem){
            let passengerCount = 0;
            // if(apply&&apply.selectApplyItem&&apply.selectApplyItem.ExtensionJson&&apply.selectApplyItem.ExtensionJson.HotelExtensionJson&&apply.selectApplyItem.ExtensionJson.HotelExtensionJson.RoomNumber>0){
            //     if(apply.selectApplyItem.ExtensionJson.HotelExtensionJson.ChummageRoomConfigs.length>0){
            //         apply.selectApplyItem.ExtensionJson.HotelExtensionJson.ChummageRoomConfigs.forEach((element)=>{
            //             if(element.ChummagePassengers && element.ChummagePassengers.length>0 && element.ChummagePassengers.length > passengerCount){
            //                 passengerCount = element.ChummagePassengers.length
            //             }
            //         })
            //     }
            // }
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
            if(everyPerNum>1 && roomCount==1 && passengerCount == travellersNum){
                return true;
            }
        }else{
            return false
        }
    }

    // 获取新的规则

    _getNewRules = (RatePlanId, RoomTypeId, isAlert, Channel, SubChannel, callBack) => {
        const { hotel, feeType, city, IsAgreement,roomCount,JourneyId,everyPerNum } = this.params;
        const { selectDate, longDay } = this.state;
        const { comp_checkTravellers, comp_travelers, loadHotelCanselRule,apply } = this.props;
        let liveDate = selectDate.addDays(longDay);
        let journeyid = 0;
        if(apply){
            if(apply.TravelApplyMode==1 && apply.JourneyList && apply.JourneyList.length>0){
                //行程模式
                if(apply.selectApplyItem){
                    journeyid = apply.selectApplyItem&&apply.selectApplyItem.Id
                }else{
                    apply.JourneyList.forEach((item,index)=>{
                        if(item?.BusinessCategory & 1){
                           journeyid = item.Id
                        }
                    })
                }
            }else{
                //目的地模式
                journeyid = apply.Id
            }
        }
        let model = //判断是初次进来还是点击预订时回来获取规则,这两个值存在是获取规则
        {
            HotelId: hotel.HotelCode,
            CheckIn: selectDate.format('yyyy-MM-dd', true),
            FeeType: feeType,
            CheckOut: liveDate.format('yyyy-MM-dd', true),
            IsAgreement: IsAgreement,
            CityId: city.Code,
            CityName: city.Name,
            Channel: Channel,
            SubChannel: SubChannel,
            RulesTravelId: comp_checkTravellers && comp_checkTravellers.RulesTravelId ? comp_checkTravellers.RulesTravelId : comp_travelers && comp_travelers.RulesTravelId,
            RatePlanId: RatePlanId,
            RoomTypeId: RoomTypeId,
            RoomCount:roomCount,
            GuestNum:everyPerNum,
            HotelShare:this.getHotelShare(),
            ApplyId: apply?.Id || 0,
            JourneyId: journeyid,
            Domestic:false,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
        }
        this.showLoadingView();
        HotelService.getHotelDetail(model).then(response => {
            this.hideLoadingView();
            if (response && response.success && response.data) {
                if (isAlert) {
                    let value
                    if (response.data.Rooms && response.data.Rooms.length > 0 && response.data.Rooms[0].RatePlans[0].CancelRules && response.data.Rooms[0].RatePlans[0].CancelRules.length > 0) {
                        value = response.data.Rooms[0].RatePlans[0].CancelRules[0].Desc
                    } else {
                        value = '免费取消'
                    }
                    this.showAlertView(value, () => {
                        return (
                            ViewUtil.getAlertButton('确定', () => {
                                this.dismissAlertView();
                            })
                        )
                    }, '取消规则')
                } else {
                    // response.data.Rooms && response.data.Rooms.map((item)=>{
                    //     if(item.RoomTypeCode === RoomTypeId ){
                    //         item && item.RatePlans && item.RatePlans.map((objItem)=>{
                    //             if(objItem.RatePlanCode===RatePlanId){
                    //                 callBack && callBack(objItem)
                    //             }
                    //         })
                    //     }
                    // })
                    callBack && callBack()
                }

            } else {
                this.hideLoadingView();
                callBack && callBack();
                if (callBack) return;
                this.toastMsg(response.message || '获取数据失败')
            }
        }).catch(error => {
            this.hideLoadingView();
            callBack && callBack();
            if (callBack) return;
            this.toastMsg(error.message || '获取数据异常');
        })


    }

    _loadList = () => {
        const { hotel, feeType, city, IsAgreement,paymentArrival,paymentAdvance,everyPerNum} = this.params;
        const { selectDate, longDay ,RoomCount} = this.state;
        const {apply } = this.props;
        let liveDate = selectDate.addDays(longDay);
        let journeyid = 0;
        if(apply){
            if(apply.TravelApplyMode==1 && apply.JourneyList && apply.JourneyList.length>0){
                //行程模式
                if(apply.selectApplyItem){
                    journeyid = apply.selectApplyItem&&apply.selectApplyItem.Id
                }else{
                    apply.JourneyList.forEach((item,index)=>{
                        if(item?.BusinessCategory & 1){
                           journeyid = item.Id
                        }
                    })
                }
            }else{
                //目的地模式
                journeyid = apply.Id
            }
        }
        let model = {
            HotelId: hotel.HotelCode,
            CheckIn: selectDate.format('yyyy-MM-dd', true),
            FeeType: feeType,
            CheckOut: liveDate.format('yyyy-MM-dd', true),
            IsAgreement: IsAgreement,
            CityId: city.Code,
            CityName: city.Name,
            Channel:hotel.Channel,
            RoomCount:RoomCount,
            GuestNum:everyPerNum,
            HotelShare:this.getHotelShare(),
            Domestic:false,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
            ApplyId: apply?.Id || 0,
            JourneyId: journeyid,
        }
        this.showLoadingView();
        HotelService.getHotelDetail(model).then(response => {
            this.hideLoadingView();
            this.setState({ isLoading: false });
            if (response && response.success) {
                if (response.data) {
                    let bedTypeGroup = [];
                    if (response.data.RoomGroups) {
                        response.data.RoomGroups.forEach(obj => {
                            let showLowes = [];
                            let min;
                            let arrT = [];
                            if (obj.RatePlans) {
                                obj.RatePlans.forEach(item => {
                                    let index = showLowes.findIndex(low => low.Channel === item.Channel);
                                    if (index === -1) {
                                        showLowes.push(item);
                                    } else {
                                        let lowItem = showLowes[index];
                                        if (lowItem.AvgPrice > item.AvgPrice) {
                                            showLowes[index] = item;
                                        }
                                    }
                                    item.RpLabel && item.RpLabel.map(_item=>{
                                        if (_item.RpLabel === '3SAgreement' || _item ==='价格计划3S协议') {
                                            arrT.push(item);
                                        }
                                    })
                                    
                                    obj.RatePlans.forEach(item => {
                                        bedTypeGroup.push(item.BedTypeGroup);
                                    })
                                    //bedTypeGroup数组去重
                                    bedTypeGroup = bedTypeGroup.filter((item, index) => {
                                        return bedTypeGroup.indexOf(item) === index;
                                    })
                                })
                                // 取出arrT中TotalAmount最小的值
                                if (arrT && arrT.length > 0) {
                                    min = arrT.reduce((prev, current) => prev.TotalAmount < current.TotalAmount ? prev : current);
                                }
                                // 判断showLowes[0] 是不是和min 的RatePlanCode相等
                                if (min) {
                                    if (showLowes[0] && showLowes[0].RatePlanCode === min.RatePlanCode) {
                                        showLowes[0] = min;
                                    } else {
                                        showLowes.push(min);
                                    }
                                    //obj.RatePlans去掉最低价格的，然后重新排序
                                    let roomList = obj.RatePlans.filter(item => !showLowes.some(low => low.RatePlanCode === item.RatePlanCode));
                                    obj.RatePlans = [...showLowes, ...roomList];
                                }
                                
                            }
                            //obj.RatePlans等于obj.RatePlans里的item的TotalAmount相等的话，item.IsRewardPoint为true的item排在item.IsRewardPoint为false的前面
                            // 主排序：TotalAmount升序，价格相等的可积分（IsRewardPoint）的排在不可积分前面
                            obj.RatePlans.sort((a, b) => {
                                // 主排序：TotalAmount升序
                                const amountCompare = Number(a?.TotalAmount || 0) - Number(b?.TotalAmount || 0);
                                
                                if (amountCompare === 0) {
                                    // 次级排序：IsRewardPoint为true的排在前
                                    const aReward = String(a?.IsRewardPoint || '');
                                    const bReward = String(b?.IsRewardPoint || '');
                                    
                                    if (aReward && !bReward ) return -1;
                                    if (bReward && !aReward ) return 1;
                                    return 0;
                                }
                                return amountCompare;
                            });
                            this.state.roomList.push({
                                room: obj.Rooms ? obj.Rooms[0] : {},
                                isOpen: false,
                                data: showLowes,
                                waitData: [...obj.RatePlans],
                                Rooms: obj.Rooms,
                                LowRate: obj.LowRate,
                                
                            });
                        })

                    }

                    if (this.state.roomList.length === 0) {
                        this.toastMsg('选择其他酒店或线下联系客服差旅顾问');
                    }
                    this.setState({
                        roomTypeList: response.data.Rooms,
                        roomDetail: response.data.Hotel,
                        LimitPrice: response.data ? response.data.LimitPrice : null,
                        ViolationModeCity: response.data ? response.data.ViolationMode : null,
                        StarRateViolationMode:response.data ? response.data.StarRateViolationMode: null,
                        StarRateLimit:response.data.StarRateLimit,
                        ShareRoomApplyFlag:response.data.ShareRoomApplyFlag,
                        isBlink:response.data.IsBlink,
                        AdvanceDayLimit:response.data.AdvanceDayLimit,
                        AdvanceDayViolationMode:response.data.AdvanceDayViolationMode,
                        bedTypeGroup:bedTypeGroup,

                    })
                }
                //现付、预付筛选
                this._selectFilterFunc(paymentArrival?'payType1':paymentAdvance?'payType2':'payType3')
            } else {
                this.toastMsg(response.message || '获取数据失败')
            }
        }).catch(error => {
            this.setState({
                isLoading: false
            })
            this.toastMsg(error.message || '获取数据异常');
        })
    }
    // 显示退改规则
    _showRuls = (data) => {
        if(data.CancelRules&&data.CancelRules[0].Cancelable===4){
            this._getNewRules(data.RatePlanCode,data.RoomTypeCode,true,data.Channel,data.SubChannel);
            return;
        }
        let canclePolicy = '';
        let bookPolicy = '';
        if (!data) return;
        if (data.CancelRules) {
            data.CancelRules.forEach(obj => {
                canclePolicy += obj.Desc;
            })
        }
        if (data.BookingRules) {
            data.BookingRules.forEach(obj => {
                bookPolicy += obj.Desc;
            })
        }

        this.showAlertView(`${I18nUtil.translate('取消政策')}：\n${canclePolicy}\n${bookPolicy?(I18nUtil.translate('预订政策')+'：\n'+bookPolicy):''}`);
    }

    _hotelDetailBtnClick = () => {
        const { selectDate, longDay, roomCount } = this.params;
        let liveDate = selectDate.addDays(longDay);
       
        this.push('HotelInstrotuction', {...this.state.roomDetail,selectDate:selectDate.format('yyyy-MM-dd hh:mm'),liveDate:liveDate.format('yyyy-MM-dd hh:mm')});
    }

    _orderBtnClick = (item, section,BigPrice) => {
        const { selectDate, city, feeType,longDay,everyPerNum } = this.params;
        let liveDate = selectDate.addDays(longDay);
        let model = {
            TotalPrice: item.TotalPrice,//每个房间N天的总价
            CheckIn: selectDate.format('yyyy-MM-dd', true),//入住日期
            CheckOut: liveDate.format('yyyy-MM-dd', true),//退房日期
            CityCode: city.Code,//城市编码
            CityName:  city.Name,//城市名称
            IsAgreement: item.IsAgreement,//是否协议酒店
            HotelCode: item.HotelCode,//酒店编码
            ChannelCode: item.Channel,//供应商渠道编码
            FeeType: feeType,//费用类型  1 因公 2 因私
            VendorCode: item.VendorCode,//实际卖家编码
            RatePlanCode: item.RatePlanCode,//酒店产品编码
            RoomTypeCode: item.RoomTypeCode,//酒店房型编码
            PaymentType: item.PaymentType,////酒店支付方式 1 现付 2 预付
            AccountId:item.AccountId,
            GuestNum:everyPerNum,
            SubChannel:item.SubChannel,
        }
        this.showLoadingView();
        HotelService.HotelOrderRatePlanPriceCheck(model).then(response => {
            this.hideLoadingView();
            if (response && response.success && response.data && response.data.data) {
                response.data.data.HasGuarantee = item.HasGuarantee
                    // 判断高危城市
                    if (this.props.highRisk && this.props.highRisk.Level ==1) {
                        this.setState({
                            alertShow:true,
                            PlanPriceCheckData:response.data.data,
                            sectionData:{...section},
                            BigPriceData:BigPrice,
                        })
                        return;
                    } 
                    if(this.props.highRisk && this.props.highRisk.Level == 2){
                        this.toastMsg('高危区域，不能预订');
                        return;
                    }
                    this._orderBtnClickNext(response.data.data,section,BigPrice);

            }else if(response.success == false && response.code === 'PriceChanges'){
                    //提示价格变动，是否继续预订
                    this.showAlertView(response.message, () => {
                        return ViewUtil.getAlertButton('取消', () => {
                            this.dismissAlertView();
                        }, '继续预订', () => {
                            this.dismissAlertView();
                            let arr = []
                            response.data?.data?.NightlyRates?.map((item) => {
                                arr.push(item.Price)
                            })
                            let _BigPrice = Math.max(...arr)
                            this._orderBtnClick(response.data?.data,section,_BigPrice);;
                        })
                    });
            }else{
                this.toastMsg(response.message || '获取数据异常');
            }
            
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }
    _orderBtnClickNext  = (item, section,BigPrice)=>{
        const { selectDate, longDay, city, hotel, feeType,roomCount,everyPerNum,JourneyId } = this.params;
        const { ViolationMode, LimitPrice, roomDetail ,customerInfo,ShareRoomApplyFlag} = this.state;
        const { compSwitch ,loadHotelCanselRule} = this.props;

        loadHotelCanselRule('');
        let roomIdModel = section.room;

      this._getNewRules(item.RatePlanCode,item.RoomTypeCode,false,item.Channel,item.SubChannel,(newRoom)=>{
        section.Rooms.forEach(obj => {
            if (obj.RoomTypeCode === item.RoomTypeCode) {
                roomIdModel = obj;
            }
        })
        let model = {
            checkIndate: selectDate,
            liveDay: longDay,
            roomCount:roomCount,
            SearchGuestNum:everyPerNum,
            CityId: city.Code,
            IsAgreement: hotel.IsAgreement,
            ViolationMode: ViolationMode,
            LimitPrice: LimitPrice,
            feeType: feeType,
            roomModel:newRoom?newRoom:item,
            orderModel: roomDetail,
            roomIdModel: roomIdModel,
            ShareRoomApplyFlag:ShareRoomApplyFlag
        }
        if (feeType === 2) {
            this.push('InterHotelOrder', {model, item});
            return;
        }
        this.showLoadingView();
        let ruleModel = {
            CityId: city.Code,
            HotelPrice: item.AvgPrice,
            StarRate:roomDetail.StarRate,
            CheckIn:selectDate.format('yyyy-MM-dd', true),
            RecommendStar:roomDetail.RecommendStar,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId
        }
        HotelService.HotelMatchTravelRulesV2(ruleModel).then(response => {
            console.log('HotelMatchTravelRulesV2',response);
            this.hideLoadingView();
            if (response && response.success) {
               if(response.data){ 
                            if(customerInfo.Setting.HotelRulesVerifyType==0){//均价判断是否超标
                                if (response.data.ViolationMode === 1) {
                                    this.toastMsg('超标禁止预订');
                                } else if (response.data.ViolationMode === 0 || response.data.ViolationMode === 2 || response.data.ViolationMode === 3) {//判断是不是去提示页状态
                                    if ((LimitPrice < item.AvgPrice) || response.data.StarRateLimit || response.data.AdvanceDayReason) {
                                        this._clickRules(response, model,item);
                                    }else {//均价未超标
                                        compSwitch ?
                                            this.push('IntlHotel_compCreateOrderScreen', {model,item,JourneyId})
                                            :
                                            this.push('InterHotelOrder', {model, item, JourneyId});
                                    }
                                } else {//超标审批、超标现付
                                    compSwitch ?
                                        this.push('IntlHotel_compCreateOrderScreen', {model, item, JourneyId})
                                        :
                                        this.push('InterHotelOrder',{model, item ,JourneyId});
                                }
                        }
                        else{//单价判断是否超标
                            if(LimitPrice < BigPrice){//单价超标 去提示页2
                                this._clickRules(response,model,item);
                            }else{//单价未超标
                                // this.push('InterHotelOrder',{model, item});
                                compSwitch ?
                                        this.push('IntlHotel_compCreateOrderScreen', {model,item,JourneyId})
                                        :
                                        this.push('InterHotelOrder',{model, item, JourneyId});
                            }
                        }
                }
            } else {
                this.toastMsg(error.message || '获取数据异常');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
      })
    }
    _clickRules=(response,model,item)=>{
        const {compSwitch} = this.props;
        const {JourneyId} = this.params;
        if(response.code==0){
            if(!response.data.AdvanceDayLimit && !response.data.CityLevelLimit && !response.data.StarRateLimit){
                compSwitch ?
                    this.push('IntlHotel_compCreateOrderScreen', {model,item,JourneyId})
                    :
                    this.push('InterHotelOrder',{model, item, JourneyId});
            }else{
                model.CustomerReason1 = response.data.CityLevelReasonList;
                if(response.data.StarRateLimit){
                    model.CustomerReason2 = response.data.StarRateReasonList;
                }
                if (response.data.AdvanceDayLimit) {
                    model.CustomerReason3 = response.data.AdvanceDayReason;
                }
                model.RcModel = {
                    ...response.data
                }
                this.push('IntelHotelRuleScreen', {model,item,JourneyId});
            }
        } else if (response.code == 1) {
            this.toastMsg('超标禁止预订')
        }
    }

    _sectionclick = (section) => {
        if(!section){return}
        section.isOpen = !section.isOpen;
        let temp = section.data;
        section.data = section.waitData;
        section.waitData = temp;
        this.setState({});
    }
    _getOriginDomain = (url) => {
        const xgIndex = url&&url.indexOf('/');
        if (xgIndex !== -1) {
            url = url.substr(xgIndex + 2);
        }
        const mhIndex = url&&url.indexOf(':');
        if (mhIndex !== -1) {
            url = url.substr(0, mhIndex);
        }
        return url;
    }
    //显示地图
    _toMap = () => {
        const { hotel } = this.params;
        this.showLoadingView();
        UserInfoDao.getToken().then(response => {
            const originDomain = this._getOriginDomain(global.baseH5Url);
            this.hideLoadingView();
            let bytes  = CryptoJS.AES.decrypt(response, Key.TOKEN);
            let decoded_response = bytes.toString(CryptoJS.enc.Utf8);
            let expiration = new Date().addDays(7);
            RctBridage.setCookie({
                name: 'tmc-token',
                value: decoded_response,
                domain: originDomain,
                origin: originDomain,
                expiration: Util.Date.toDate(expiration).format('yyyy-MM-dd HH:mm'),
                path: '/',
            })
            // let url = `${global.baseH5Url}/application/detail?Id=1050`;
            let url = `${global.baseH5Url}/hotel/map?isHideHeader=true&&Longitude=${hotel.Longitude}&&Latitude=${hotel.Latitude}&&HotelName=${hotel.HotelName}`
            this.push('Web', {
                title: '地图',
                url: url
            })
        }).catch(error => {
            this.hideLoadingView();
        })
    }

    // 打电话
    _callHotel = () => {
        const { hotel, } = this.params;
        var url = `tel:${hotel.Phone}`;
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                return Linking.openURL(url);
            } else {
                console.log('Can\'t handle url: ' + url);
            }
        }).catch(err => {
            console.log(err);
        });
    }


    renderBody() {
        const { roomList,roomListArrs } = this.state;
        if(this.state.itemRoomsData)return null;
        // const [showPopover, setShowPopover] = useState(false);
        const unescapeHTML = (str) => {
            return str?.replace(/&lt;/g, '<')
                     ?.replace(/&gt;/g, '>')
                     ?.replace(/&quot;/g, '"')
                     ?.replace(/&amp;/g, '&');
        };
        return (
            <View style={{
                flex:1
            }}>
            { <View style={{ flex: 1 }}>               
                    <SectionList
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={this._renderHeader()}
                        sections={roomListArrs}
                        renderItem={this._renderItem}
                        renderSectionHeader={this._renderSectionHeader}
                        keyExtractor={(item, index) => String(index)}
                        ListFooterComponent={this._renderFooter()}
                    />
               {this._testAlert()}
               {this.state.itemData&&<Animated.View style={{ position: "absolute", top: this.state.securetyTipViewY,  height: screenHeight, width: screenWidth }}>
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' ,backgroundColor:'rgba(3,3,3,0.3)'}}>
                                
                                <View style={{position: "absolute", width: screenWidth, height: screenHeight / 3 * 2, backgroundColor: '#fff', bottom: 0, padding: 15, borderTopLeftRadius: 12, borderTopRightRadius: 12}}>
                                        <View style={{ width: screenWidth - 30, height: 35, justifyContent:'space-between',flexDirection:'row' }}>
                                            <CustomText text={''} style={{ fontSize: 16 }} />
                                            <CustomText text={'房间详情'} style={{ fontSize: 16 }} />
                                            <TouchableOpacity style={{ width: 35, height: 35 }} onPress={this._hiddenTipView}>
                                                <AntDesign name={'close'} size={24} color={'gray'} style={{ marginLeft: 5 }} />
                                            </TouchableOpacity>
                                        </View>
                                        <ScrollView showsVerticalScrollIndicator={false} style={{marginBottom:40}} keyboardShouldPersistTaps='handled'>
                                            {this.state.imageArrs && this.state.imageArrs.length>0 ?
                                            <View style={{width:screenWidth-30,height:180}}>      
                                                <Swiper
                                                    autoplay={true}
                                                    borderRadius={3}
                                                    dotStyle={{width:0,height:0}}
                                                    activeDotStyle={{width:0,height:0}}
                                                    >
                                                    {this.state.imageArrs.map((item, index) => {
                                                        return (
                                                            <TouchableOpacity style={{width:screenWidth-30,height:180}}
                                                            onPress={() => {
                                                                    this.push('HotelRoomPicIDetail',{
                                                                        items: this.state.imageArrs,
                                                                        index: index
                                                                    });}}>                                                                                                                              
                                                                <ImageBackground
                                                                    source={{
                                                                    uri:item,
                                                                    }}
                                                                    resizeMode={'stretch'}
                                                                    style={{flex:1}}
                                                                    key={index}
                                                                    imageStyle={{borderRadius:10}}
                                                                >
                                                                    <View style={styles.imageItemStyle}>
                                                                        <Image source={require('../../res/Uimage/hotelFloder/_pic.png')} style={{ width: 14, height: 14 }} />
                                                                        <Text style={{color:'#fff'}}>{index+1+'/'+this.state.imageArrs.length}</Text>
                                                                    </View>
                                                                </ImageBackground>
                                                                
                                                        </TouchableOpacity>
                                                        );
                                                            
                                                        })}
                                                </Swiper>
                                            
                                            </View>:null
                                            } 
                                            <View style={{width:screenWidth-30}}>
                                                <CustomText text={this.state.groupName} style={{  fontSize: 14, marginTop: 20,fontWeight:'bold' }} />
                                                <View style={{flexDirection:'row',width:screenWidth-30}}>
                                                    {this.state.itemData.RatePlanName? <View  style={{width:screenWidth/2-30,flexDirection:'row',marginBottom:15,marginTop:20}}>
                                                        <CustomText text='房间' style={styles.textSt} />
                                                        <CustomText text='：' style={styles.textSt} />  
                                                        <CustomText text={this.state.itemData.RatePlanName} style={{ fontSize:13 }} /> 
                                                    </View>:null}
                                                </View> 
                                                <View style={{marginTop:this.state.itemData.RatePlanName?0:20,width:screenWidth-30,}}>
                                                
                                                {this.state.itemData.BedType? <View  style={styles.textViewSt}>
                                                        <CustomText text='床型' style={styles.textSt} />
                                                        <CustomText text='：' style={styles.textSt} /> 
                                                        <CustomText text={this.state.itemData.BedType} style={{ fontSize:13 }} /> 
                                                    </View>:null}
                                                    {this.state.itemData.MealTypeDesc? <View style={styles.textViewSt}>
                                                        <CustomText text='早餐' style={styles.textSt} /> 
                                                        <CustomText text='：' style={styles.textSt} /> 
                                                        <CustomText text={this.state.itemData.MealTypeDesc} style={{ fontSize:13 }} /> 
                                                    </View>:null}
                                                    {this.state.itemWindow? <View style={styles.textViewSt}>
                                                    <CustomText text='是否有窗' style={styles.textSt} /> 
                                                        <CustomText text='：' style={styles.textSt} /> 
                                                        <CustomText text={this.state.itemWindow} style={{ fontSize:13 }} />
                                                    </View>:null}
                                                    {this.state.itemArea? <View style={styles.textViewSt}>
                                                    <CustomText text='面积㎡' style={styles.textSt} /> 
                                                         <CustomText text='：' style={styles.textSt} /> 
                                                        <CustomText text={this.state.itemArea} style={{ fontSize:13 }} />
                                                    </View>:null}
                                                    {this.state.itemFloor? <View style={styles.textViewSt}>
                                                    <CustomText text='楼层' style={styles.textSt} /> 
                                                        <CustomText text='：' style={styles.textSt} /> 
                                                        <CustomText text={this.state.itemFloor} style={{ fontSize:13 }} />
                                                    </View>:null}
                                                    {this.state.itemData.ChannelTag? <View style={styles.textViewSt}>
                                                        <CustomText text='所属渠道' style={styles.textSt} /> 
                                                        <CustomText text='：' style={styles.textSt} /> 
                                                        <CustomText text={this.state.itemData.ChannelTag} style={{ fontSize:13 }} /> 
                                                    </View>:null}
                                                    {this.state.itemData.IsAgreement? <View style={styles.textViewSt}>
                                                    <CustomText text='协议价' style={styles.textSt} /> 
                                                        <CustomText text='：' style={styles.textSt} /> 
                                                        <CustomText text='是' style={{ fontSize:13 }} />
                                                    </View>:null}
                                                    {this.state.itemData.IsPromotion? <View style={styles.textViewSt}>
                                                    <CustomText text='是否优惠' style={styles.textSt} /> 
                                                        <CustomText text='：' style={styles.textSt} />  
                                                        <CustomText text='是' style={{ fontSize:14 }} />
                                                    </View>:null}
                                                    {this.state.itemData.PaymentType? <View style={styles.textViewSt}>
                                                    <CustomText text='结算方式' style={styles.textSt} /> 
                                                        <CustomText text='：' style={styles.textSt} /> 
                                                        <CustomText text= {this.state.itemData.PaymentType === 1 ? '到付' : '预付'} style={{ fontSize:13 }} />
                                                    </View>:null}
                                                    {this.state.itemData.CancelRules? <View style={styles.textViewSt}>
                                                    <CustomText text='宽带类型' style={styles.textSt} /> 
                                                    <CustomText text='：' style={styles.textSt} /> 
                                                        <CustomText text= { this.state.itemData.CancelRules&&this.state.itemData.CancelRules[0].Cancelable===1?
                                                                                            '无':
                                                                            (this.state.itemData.CancelRules&&this.state.itemData.CancelRules[0].Cancelable===2?
                                                                                                                    '免费':
                                                                            (this.state.itemData.CancelRules&&this.state.itemData.CancelRules[0].Cancelable===3?
                                                                                            '付费':'无'))
                                                                        }  style={{ fontSize:14 }} />
                                                    </View>:null}
                                                </View>  
                                            </View>        
                                            <View style={{height:1,backgroundColor:Theme.lineColor,width:screenWidth-30}}/>
                                            {this.state.itemDescription?<View>
                                                <View style={{flexDirection:'row'}}>
                                                    <CustomText text='房间简介' style={{ fontSize: 13, color: Theme.darkColor }} />
                                                    <CustomText text='：' style={{ fontSize: 13, color: Theme.darkColor }} />
                                                </View>
                                                <RenderHtml
                                                    source={{ 
                                                        html: unescapeHTML(this.state.itemDescription) // 应用反转义函数
                                                    }} 
                                                /> 
                                            </View>:null}
                                        </ScrollView>
                                 </View> 
                        </View>   
                    </Animated.View>}
          </View>}
          </View>
       
        )
    }

    _testAlert = () => {
        const {alertShow} = this.state;
        if (!this.props.highRisk || !this.props.highRisk.Level ==1 || !alertShow){return}
        return(
          <View  style={{position:'absolute',top:-94, height:global.screenHeight, width:global.screenWidth}}>
            <View style={styles.container2}>
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
        const{PlanPriceCheckData,sectionData,BigPriceData}= this.state;
        this._orderBtnClickNext(PlanPriceCheckData,sectionData,BigPriceData);
        this.setState({alertShow:false});
    }

    _renderSectionHeader = ({ section }) => {
        const {everyPerNum} = this.params
        let room = section.room;
        const unescapeHTML = (str) => {
            return str?.replace(/&lt;/g, '<')
                    ?.replace(/&gt;/g, '>')
                    ?.replace(/&quot;/g, '"')
                    ?.replace(/&amp;/g, '&');
                     // 截取前3行并添加省略号
                    const lines = decoded?.split(/<br\s*\/?>|<\/p>/gi) || [];
                    const truncated = lines.slice(0, 3).join('<br>');
                    return lines.length > 3 ? `${truncated}...` : decoded;
        };
       
        return (
          <TouchableHighlight underlayColor='transparent' onPress={this._sectionclick.bind(this, section)}>
            <View style={{ flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: Theme.lineColor, padding: 10 }}>
                <Image style={{ marginLeft: 5, marginTop: 1, width: '25%', height: 75, borderRadius:4 }} source={room.CoverImage ? { uri: room.CoverImage } : require('../../res/image/replaceFcm.jpeg')} />
                <View style={{ width: '65%',marginLeft:10}}>
                    {/* <View style={{ }}> */}
                        <CustomText text={room.RoomName} numberOfLines={2} />
                        <View style={{ 
                            maxHeight: 60, // 假设行高20*3
                            overflow: 'hidden',
                            flex: 0 // 防止flex布局拉伸
                        }}>
                            <RenderHtml
                                source={{ 
                                    html: unescapeHTML(room.Desc), // 应用反转义函数
                                }}
                            />
                        </View>
                    {/* </View> */}
                    <View style={{ alignSelf: 'flex-end'}}>
                        <View style={{ marginLeft: 10, flexDirection: 'row', alignItems: 'center' }}>
                            {<CustomText text={section.LowRate<=0?'已售完':`${section?.data?.[0]?.AvgPrice}CNY`} style={{ color: Theme.theme, marginRight: 5 }} />}
                            <Ionicons name={section.isOpen ? 'chevron-up' : 'chevron-down'} size={24} color={Theme.theme} style={{marginRight: 10}} />
                        </View>
                        <View style={{}}>
                            <CustomText text={`${everyPerNum}adult per room`} style={{fontSize:12,color:Theme.commonFontColor}} numberOfLines={2} />
                        </View>
                    </View>
                </View>
            </View>
          </TouchableHighlight>
        )
    }
    _renderItem = ({ item: data, index, section }) => {
        //遍历section.Rooms.HotelCode 和data.HotelCode对比，相同就传图片到弹框展示
        if (!data) {
            return null;
        }
        const { compSwitch } = this.props;
        let cancle = I18nUtil.translate('取消政策') + ':';
        if (data.CancelRules && data.CancelRules.length > 0) {
            if (data.CancelRules[0]) {
                cancle = cancle + data.CancelRules[0]['Desc'];
            }
        } else {
            cancle = cancle + I18nUtil.translate('免费取消');
        }
        let arr = []
        data.NightlyRates.map((item) => {
            arr.push(item.Price)
        })
        let BigPrice = Math.max(...arr)
        return (
            section.isOpen ?//判断是否展开
                // data.Status === 1?//判断是否有房，无房不显示
                <TouchableOpacity style={styles.listLitleItemStyle} onPress={
                    this._showTipView.bind(this, section.Rooms, data, section.room.RoomName)
                }>
                    <View style={{ flexDirection: 'column' }}>
                        <View style={{ flexDirection: 'row' ,alignItems:'center',justifyContent:'space-between',marginTop:12,marginHorizontal:10,}}>
                            <Text allowFontScaling={false} style={{ fontSize: 14, color:Theme.fontColor,width: global.screenWidth-120}}>{data.RatePlanName}</Text>
                            <View style={{ flexDirection: 'row',alignItems:'center' }}>
                                <CustomText style={{ marginLeft: 10, color: Theme.theme,fontSize:12 }} text='详情' onPress={
                                    this._showTipView.bind(this, section.Rooms, data, section.room.RoomName)
                                }></CustomText>
                                <AntDesign name={'right'} size={12} color={Theme.theme} />
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row' ,paddingHorizontal:10}}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <View style={{ flexDirection: 'row', marginTop: 10, alignContent: 'center' }}>
                                    {
                                        data.ChannelTag ?
                                            <View style={{ backgroundColor: Theme.theme, alignItems: 'center', justifyContent: 'center',marginRight: 10, borderColor: Theme.theme, borderWidth: 1, borderRadius: 2, paddingHorizontal:6 }}>
                                                <CustomText text={data.ChannelTag} style={{ color: 'white', fontSize: 11}} />
                                            </View>
                                        : null
                                    }
                                    {
                                        data.RpLabel && data.RpLabel.map(obj=>{
                                            let label;
                                             if(obj === '2SAgreement' || obj ==='价格计划2S协议'){
                                                 label = 'FCM';
                                             }else if (obj === '3SAgreement' || obj ==='价格计划3S协议') {
                                                label = Util.Parse.isChinese()?'协议':'Corp';
                                            }else{
                                                label = ''
                                            }
                                           return (
                                            <View style={{ backgroundColor:'orange', alignItems: 'center', justifyContent: 'center', marginRight: 10, borderColor:'orange', borderWidth: 1, borderRadius: 2 , paddingHorizontal:6}}>
                                               <CustomText text={label} style={{  fontSize: 11, padding:1,color:'#fff' }} />
                                            </View>
                                           )
                                        })
                                    }
                                    <CustomText style={{ fontSize: 13, color: Theme.theme }} text={data.IsRewardPoint === true ? '可积分' : data.IsRewardPoint === false ? '不可积分' : ''}></CustomText>
                                    {
                                        this.state.isBlink && data.PaymentType === 1 ?
                                        <View style={{ alignItems: 'center', justifyContent: 'center', marginRight: 10, borderColor:'orange', borderWidth: 1, borderRadius: 2 , paddingHorizontal:6 }}>
                                                <CustomText text={'Billink'} style={{ fontSize: 11, padding:1,color:'#e68d40' }} />
                                        </View>:null
                                    }
                                </View>
                                <View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                                        <AntDesign name={'clockcircleo'} size={13} color={'gray'} />
                                        <CustomText style={{ marginLeft: 3, fontSize: 13, color: Theme.darkColor }} text='立即确认' />
                                    </View>
                                </View>
                                <View style={{flexDirection:'row',alignItems:'center',marginVertical:5}}>
                                    {
                                        data.HasGuarantee&&
                                            <View style={{borderRadius:2,backgroundColor: Theme.theme, alignItems: 'center',height:18,paddingHorizontal:6,justifyContent:'center',marginRight:6}}>
                                                <CustomText
                                                    style={{
                                                        color: 'white',
                                                        fontSize: 11,
                                                    }}
                                                    text="担保"
                                                />
                                            </View>
                                    }
                                 </View>
                                 <View style={{flexDirection:'row',alignItems:'center',marginVertical:5}}>
                                    {
                                        data.NeedCreditCard && data.PaymentType === 2?
                                            <View style={{borderRadius:2,backgroundColor: Theme.theme, alignItems: 'center',height:18,paddingHorizontal:6,justifyContent:'center',marginRight:6}}>
                                                <CustomText
                                                    style={{
                                                        color: 'white',
                                                        fontSize: 11,
                                                    }}
                                                    text="信用卡"
                                                />
                                            </View>:null
                                    }
                                 </View>
                                 <TouchableOpacity style={{ height: 18, flexDirection:'row',marginBottom:15 }} onPress={this._showRuls.bind(this, data)} >
                                            <CustomText style={{ fontSize: 13, color: Theme.theme}}
                                                text={
                                                    data.CancelRules && data.CancelRules[0].Cancelable === 1 ?
                                                        '免费取消' :
                                                        data.CancelRules && data.CancelRules[0].Cancelable === 2 ?
                                                            '不可取消' :
                                                            data.CancelRules && data.CancelRules[0].Cancelable === 3 ?
                                                                '限时取消' :
                                                                data.CancelRules && data.CancelRules[0].Cancelable === 4 ?
                                                                    '点击查看' : '不可取消'
                                                }
                                            />
                                </TouchableOpacity>
                            </View>
                            {
                                compSwitch ? this._compYudingClick(data, section, BigPrice) : this._yudingClick(data, section, BigPrice)
                            }
                        </View>

                    </View>
                </TouchableOpacity>
                : this._sshow(data, index, section)
        )
    }

    _sshow = (data, index, section) => {
        if (!data) {
            return null;
        }
        const { compSwitch } = this.props;
        let cancle = I18nUtil.translate('取消政策') + ':';
        if (data.CancelRules && data.CancelRules.length > 0) {
            if (data.CancelRules[0]) {
                cancle = cancle + data.CancelRules[0]['Desc'];
            }
        } else {
            cancle = cancle + I18nUtil.translate('免费取消');
        }
        let arr = []
        data.NightlyRates.map((item) => {
            arr.push(item.Price)
        })
        let BigPrice = Math.max(...arr)
        return (
            <TouchableOpacity style={styles.listLitleItemStyle} onPress={
                this._showTipView.bind(this, section.Rooms, data, section.room.RoomName)
            }>
                <View style={{ flexDirection: 'column' }}>
                    <View style={{ flexDirection: 'row' ,alignItems:'center',justifyContent:'space-between',marginTop:12,marginHorizontal:10,}}>
                        <Text allowFontScaling={false} style={{ fontSize: 14, color:Theme.fontColor,width: global.screenWidth-120}}>{data.RatePlanName}</Text>
                        <View style={{ flexDirection: 'row',alignItems:'center' }}>
                            <CustomText style={{ marginLeft: 10, color: Theme.theme,fontSize:12 }} text='详情' onPress={
                                this._showTipView.bind(this, section.Rooms, data, section.room.RoomName)
                            }></CustomText>
                            <AntDesign name={'right'} size={12} color={Theme.theme} />
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row' ,paddingHorizontal:10}}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <View style={{ flexDirection: 'row', marginTop: 10, alignContent: 'center' }}>
                                {
                                    data.ChannelTag ?
                                        <View style={{ backgroundColor: Theme.theme, alignItems: 'center', justifyContent: 'center',marginRight: 10, borderColor: Theme.theme, borderWidth: 1, borderRadius: 2, paddingHorizontal:6 }}>
                                            <CustomText text={data.ChannelTag} style={{ color: 'white', fontSize: 11}} />
                                        </View>
                                    : null
                                }
                                {
                                    data.RpLabel && data.RpLabel.map(obj=>{
                                        let label;
                                         if(obj === '2SAgreement' || obj ==='价格计划2S协议'){
                                             label = 'FCM';
                                         }else if (obj === '3SAgreement' || obj ==='价格计划3S协议') {
                                            label = Util.Parse.isChinese()?'协议':'Corp';
                                        }else{
                                            label = ''
                                        }
                                       return (
                                        <View style={{ backgroundColor:'orange', alignItems: 'center', justifyContent: 'center', marginRight: 10, borderColor:'orange', borderWidth: 1, borderRadius: 2 , paddingHorizontal:6}}>
                                           <CustomText text={label} style={{  fontSize: 11, padding:1,color:'#fff' }} />
                                        </View>
                                       )
                                    })
                                }
                                <CustomText style={{ fontSize: 13, color: Theme.theme }} text={data.IsRewardPoint === true ? '可积分' : data.IsRewardPoint === false ? '不可积分' : ''}></CustomText>
                                {
                                    this.state.isBlink && data.PaymentType === 1 ?
                                    <View style={{ alignItems: 'center', justifyContent: 'center', marginRight: 10, borderColor:'orange', borderWidth: 1, borderRadius: 2 , paddingHorizontal:6 }}>
                                            <CustomText text={'Billink'} style={{ fontSize: 11, padding:1,color:'#e68d40' }} />
                                    </View>:null
                                }
                            </View>
                            <View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                                    <AntDesign name={'clockcircleo'} size={13} color={'gray'} />
                                    <CustomText style={{ marginLeft: 3, fontSize: 13, color: Theme.darkColor }} text='立即确认' />
                                </View>
                            </View>
                            <View style={{flexDirection:'row',alignItems:'center',marginVertical:5}}>
                                {
                                    data.HasGuarantee&&
                                        <View style={{borderRadius:2,backgroundColor: Theme.theme, alignItems: 'center',height:18,paddingHorizontal:6,justifyContent:'center',marginRight:6}}>
                                            <CustomText
                                                style={{
                                                    color: 'white',
                                                    fontSize: 11,
                                                }}
                                                text="担保"
                                            />
                                        </View>
                                }
                             </View>
                             <View style={{flexDirection:'row',alignItems:'center',marginVertical:5}}>
                                    {
                                        data.NeedCreditCard && data.PaymentType === 2?
                                            <View style={{borderRadius:2,backgroundColor: Theme.theme, alignItems: 'center',height:18,paddingHorizontal:6,justifyContent:'center',marginRight:6}}>
                                                <CustomText
                                                    style={{
                                                        color: 'white',
                                                        fontSize: 11,
                                                    }}
                                                    text="信用卡"
                                                />
                                            </View>:null
                                    }
                             </View>
                             <TouchableOpacity style={{ height: 18, flexDirection:'row',marginBottom:15 }} onPress={this._showRuls.bind(this, data)} >
                                        <CustomText style={{ fontSize: 13, color: Theme.theme}}
                                            text={
                                                data.CancelRules && data.CancelRules[0].Cancelable === 1 ?
                                                    '免费取消' :
                                                    data.CancelRules && data.CancelRules[0].Cancelable === 2 ?
                                                        '不可取消' :
                                                        data.CancelRules && data.CancelRules[0].Cancelable === 3 ?
                                                            '限时取消' :
                                                            data.CancelRules && data.CancelRules[0].Cancelable === 4 ?
                                                                '点击查看' : '不可取消'
                                            }
                                        />
                            </TouchableOpacity>
                        </View>
                        {
                            compSwitch ? this._compYudingClick(data, section, BigPrice) : this._yudingClick(data, section, BigPrice)
                        }
                    </View>

                </View>
            </TouchableOpacity>
        )
    }

    getViolationModeDesc = (mode) => {
        const modeMap = {
          0: '超标弹窗提示',
          1: '超标禁止预订',
          2: '超标审批',
          3: '超标现付',
          4: '超标自选审批或现付',
        };
        return modeMap[mode] || '未知处理模式';
      }

    _alert = (StarRateLimit,AdvanceDayLimit,limitPrice) => {
        const { ViolationModeCity,AdvanceDayViolationMode } = this.state;
        let rulelist = [
            {_Rulelimit:'城市住宿标准',_ViolationMode:ViolationModeCity},
            {_Rulelimit:'违背星级限制',_ViolationMode:ViolationModeCity},
            {_Rulelimit:'违背提前天数限制',_ViolationMode:AdvanceDayViolationMode}]
        let reasonlist = []
        if(StarRateLimit){
            reasonlist.push(rulelist[1])
        }
        if(AdvanceDayLimit){
            reasonlist.push(rulelist[2])
        }
        if(limitPrice){
            reasonlist.push(rulelist[0])
        }
        Pop.show(
            <View style={styles.popStyle}>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',margin:20}}>
                    <CustomText text={'违背政策详情'} style={{fontSize:15,fontWeight:'bold',color:Theme.RedMarkColor}}/>
                    <TouchableOpacity onPress={()=>{Pop.hide()}}>
                    <FontAwesome name='close' size={15} color={Theme.darkColor} style={{marginLeft:10}}></FontAwesome>
                    </TouchableOpacity>
                </View>
                <View style={{width:'100%',height:1,backgroundColor:Theme.lineColor}}></View>
                {
                    reasonlist.map((item)=>{
                        return (
                            <View style={{padding:10,backgroundColor:Theme.pinkBg,marginHorizontal:20,marginTop:15,borderRadius:8}}>
                                <View style={{flexDirection:'row',alignItems:'center'}}>
                                <FontAwesome name='exclamation-circle' size={15} color={Theme.RedMarkColor} style={{marginLeft:10}}></FontAwesome>
                                <CustomText text={item._Rulelimit} style={{color:Theme.RedMarkColor,marginLeft:5}}/>
                                </View>
                                <CustomText text={this.getViolationModeDesc(item._ViolationMode)} style={{marginLeft:30}}/>
                            </View>
                        )
                    })
                }
            </View>,
            {animationType: 'slide-up', maskClosable: true, onMaskClose: ()=>{}}
        )
    }

  
    _yudingClick=(data,section,BigPrice)=>{
        const { StarRateLimit, StarRateViolationMode, ViolationModeCity,isOnlyApply,AdvanceDayLimit,AdvanceDayViolationMode,customerInfo } = this.state;
        const { customerInfo_userInfo,apply } = this.props;
        let closeBook = false
        if(customerInfo_userInfo.customerInfo.Setting.IsApplyOnly && !customerInfo_userInfo.userInfo.NoNeedApply&& !apply){
            closeBook = true;
        }
        // 高风险状态判断
        const isHighRisk = data.Status === 3 || (this.props.highRisk?.Level === 2);

        // 价格违规判断
        const isPriceViolation = this.state.LimitPrice !== 0 && this.state.LimitPrice < data.AvgPrice && ViolationModeCity === 1;

        //价格 星级 天数 违规条件
        const hasViolation = isPriceViolation || (StarRateLimit && StarRateViolationMode === 1)|| (AdvanceDayLimit && AdvanceDayViolationMode === 1);
        const DisableBook =
            !!customerInfo?.Setting?.DisableBookingOnlyView &&
            !customerInfo_userInfo?.userInfo?.EnableBookingIfCustomerDisable; 
        return(
        <View style={{justifyContent:'center',alignItems:'center'}}>
          {!isOnlyApply?
            <TouchableOpacity style={{ marginLeft:10,flexDirection:'row',alignItems:'center'}} 
                                underlayColor='transparent'
                                onPress={() => {
                                    if (data.Status === 3) return;
                                    if (DisableBook) {
                                        this.toastMsg("暂无预订权限，请联系差旅顾问");
                                        return;
                                    }
                                    this._orderBtnClick(data, section, BigPrice);
                                }}>
                <View style={{flexDirection:'column'}}>
                {data.CurrencyInfo&&<View style={{flexDirection:'row'}}>    
                    <Text allowFontScaling={false} style={{ marginTop: 10, color: Theme.theme, fontSize: 18 ,fontWeight:'bold'}}>{data.CurrencyInfo.PriceList.AvgPrice}</Text>
                    <Text allowFontScaling={false} style={{ marginRight: 3, marginTop: 13, color: Theme.theme, fontSize: 13 }}>{data.CurrencyInfo.Currency}</Text>
                    {data.CurrencyInfo?.PriceList?.AvgTax ? <CustomText text='(含税)' style={{ fontSize: 12, marginTop: 13, color: Theme.theme}} />:null}
                </View>}
                {data.CurrencyInfo?.PriceList?.AvgTax ? <View style={{flexDirection:'row',marginRight: 10}}>
                        <CustomText text='税费' style={{ fontSize: 12, color: Theme.theme,marginRight: 3}} />
                        <Text allowFontScaling={false} style={{ marginRight: 3, color: Theme.theme, fontSize: 11 }}>{data.CurrencyInfo.Currency}</Text>
                        <CustomText text={data.CurrencyInfo.PriceList.AvgTax} style={{ fontSize: 12, color: Theme.theme}} />
                    </View>:null}
                {
                    data.CurrencyInfo && data.CurrencyInfo.Currency!='CNY'?
                        <View style={{flexDirection:'row'}}>
                        <Text allowFontScaling={false} style={{ marginRight: 10, color: Theme.theme, fontSize: 14 }}>{'≈'}</Text>
                            <Text allowFontScaling={false} style={{ marginRight: 10, color: Theme.theme, fontSize: 14 }}>{data.AvgPrice+'CNY'}</Text>
                        </View>
                    :null
                }
                <View style={{ alignItems:'flex-end' }}>
                    {Util.Parse.isChinese() ?
                                <View style={{ alignItems: 'center', justifyContent: 'center'}}>
                                    {    
                                        StarRateLimit || AdvanceDayLimit ||(this.state.LimitPrice!=0 && this.state.LimitPrice < data.AvgPrice) ?
                                        <TouchableOpacity onPress={()=>this._alert(StarRateLimit,AdvanceDayLimit,this.state.LimitPrice!=0 && this.state.LimitPrice < data.AvgPrice)}>
                                            <CustomText text='违背' style={styles.ruleStyle} />
                                        </TouchableOpacity>:null
                                    }
                                </View>
                                :null
                    }
                </View>
                </View>
                <View style={{borderRadius:4,paddingHorizontal:5}}>
                    <View style={{
                        flex: 2, 
                        padding:2,
                        alignItems:'center',
                        justifyContent:'center',
                        borderTopRightRadius:4 ,
                        borderTopLeftRadius:4 ,
                        backgroundColor:isHighRisk || hasViolation || DisableBook ? 'gray' : Theme.theme,
                        }}>
                        <CustomText text={data.Status === 3?'订 完':'预 订'} style={{ color:'#fff',fontSize:14,paddingHorizontal:5}} /> 
                    </View>
                    <View style={{
                        flex: 2, 
                        padding:2,
                        alignItems:'center',
                        justifyContent:'center',
                        borderBottomRightRadius:4 ,
                        borderBottomLeftRadius:4 ,
                        borderColor:isHighRisk || hasViolation || DisableBook ? 'gray' : Theme.theme,
                        borderWidth:1,
                        }}>
                        <CustomText text={data.PaymentType === 1 ? '到付' : '预付'} style={{ color:Theme.theme,fontSize:12}} /> 
                    </View>       
                </View>
            </TouchableOpacity>
            :
            <TouchableOpacity style={{ marginLeft:10,flexDirection:'row',alignItems:'center'}} 
                              onPress={()=>{ 
                                  if (data.Status === 3) return;
                                  if (DisableBook) {
                                      this.toastMsg("暂无预订权限，请联系差旅顾问");
                                      return;
                                  }
                                  this.toastMsg("请选择申请单预订"); 
                              }}
            >
                <View style={{flexDirection:'column'}}>
                {data.CurrencyInfo&&<View style={{flexDirection:'row'}}>    
                    <Text allowFontScaling={false} style={{ marginTop: 10, color: Theme.theme, fontSize: 18 ,fontWeight:'bold'}}>{data.CurrencyInfo.PriceList.AvgPrice}</Text>
                    <Text allowFontScaling={false} style={{ marginRight: 10, marginTop: 13, color: Theme.theme, fontSize: 13 }}>{data.CurrencyInfo.Currency}</Text>
                </View>}
                {
                    data.CurrencyInfo && data.CurrencyInfo.Currency!='CNY'?
                    <View style={{flexDirection:'row'}}>
                        <Text allowFontScaling={false} style={{ marginRight: 5, color: Theme.theme, fontSize: 14 }}>{'≈'}</Text>
                        <Text allowFontScaling={false} style={{ marginRight: 10, color: Theme.theme, fontSize: 14 }}>{data.AvgPrice+'CNY'}</Text>
                    </View>
                    :null
                }
                <View style={{ alignItems:'flex-end' }}>
                    {   
                        Util.Parse.isChinese() ?
                                <View style={{ alignItems: 'center', justifyContent: 'center'}}>
                                    {    
                                        StarRateLimit || AdvanceDayLimit ||(this.state.LimitPrice!=0 && this.state.LimitPrice < data.AvgPrice) ?
                                        <TouchableOpacity onPress={()=>this._alert(StarRateLimit,AdvanceDayLimit,this.state.LimitPrice!=0 && this.state.LimitPrice < data.AvgPrice)}>
                                            <CustomText text='违背' style={styles.ruleStyle} />
                                        </TouchableOpacity>:null
                                    }
                                </View>
                        : null
                    }
                </View>
                </View>
                <View style={{borderRadius:4}}>
                    <View style={{
                        flex: 2, 
                        padding:2,
                        paddingHorizontal:5,
                        alignItems:'center',
                        justifyContent:'center',
                        borderTopRightRadius:4 ,
                        borderTopLeftRadius:4 ,
                        backgroundColor:'gray',
                        }}>
                        <CustomText text={data.Status === 3?'订 完':'预 订'} style={{ color:'#fff',fontSize:14,paddingHorizontal:5}} /> 
                    </View>
                    <View style={{
                        flex: 2, 
                        padding:2,
                        alignItems:'center',
                        justifyContent:'center',
                        borderBottomRightRadius:4 ,
                        borderBottomLeftRadius:4 ,
                        borderColor:'gray',
                        borderWidth:1,
                        }}>
                    <CustomText text={data.PaymentType === 1 ? '到付' : '预付'} style={{ color:Theme.theme,fontSize:12}} /> 
                    </View>       
                </View>
            </TouchableOpacity>
            }
        </View>
        )

    }
    _compYudingClick=(data,section,BigPrice)=>{
        const { StarRateLimit, StarRateViolationMode, ViolationModeCity,isOnlyApply,AdvanceDayLimit,AdvanceDayViolationMode,customerInfo } = this.state;
        const { customerInfo_userInfo } = this.props;
        // 高风险状态判断
        const isHighRisk = data.Status === 3 || (this.props.highRisk?.Level === 2);

        // 价格违规判断
        const isPriceViolation = this.state.LimitPrice !== 0 && this.state.LimitPrice < data.AvgPrice && ViolationModeCity === 1;

        //价格 星级 天数 违规条件
        const hasViolation = isPriceViolation || (StarRateLimit && StarRateViolationMode === 1)|| (AdvanceDayLimit && AdvanceDayViolationMode === 1);
        const DisableBook =
            !!customerInfo?.Setting?.DisableBookingOnlyView &&
            !customerInfo_userInfo?.userInfo?.EnableBookingIfCustomerDisable;
        return(
        <View style={{justifyContent:'center',alignItems:'center'}}>
           {!isOnlyApply?
            <TouchableOpacity style={{ marginLeft:10,flexDirection:'row',alignItems:'center'}} 
                                underlayColor='transparent'
                                onPress={() => {
                                    if (data.Status === 3) return;
                                    if (DisableBook) {
                                        this.toastMsg("暂无预订权限，请联系差旅顾问");
                                        return;
                                    }
                                    this._orderBtnClick(data, section, BigPrice);
                                }}>
                <View style={{flexDirection:'column'}}>
                    {data.CurrencyInfo&&<View style={{flexDirection:'row'}}>    
                        <Text allowFontScaling={false} style={{ marginTop: 10, color: Theme.theme, fontSize: 18 ,fontWeight:'bold'}}>{data.CurrencyInfo.PriceList.AvgPrice}</Text>
                        <Text allowFontScaling={false} style={{ marginRight: 3, marginTop: 13, color: Theme.theme, fontSize: 13 }}>{data.CurrencyInfo.Currency}</Text>
                        {data.CurrencyInfo?.PriceList?.AvgTax?<CustomText text='(含税)' style={{ fontSize: 12, marginTop: 13, color: Theme.theme}} />:null}
                    </View>}
                    {data.CurrencyInfo?.PriceList?.AvgTax?<View style={{flexDirection:'row',marginRight: 10}}>
                        <CustomText text='税费' style={{ fontSize: 12, color: Theme.theme, marginRight: 3}} />
                        <Text allowFontScaling={false} style={{ marginRight: 3, color: Theme.theme, fontSize: 11 }}>{data.CurrencyInfo.Currency}</Text>
                        <CustomText text={data.CurrencyInfo?.PriceList?.AvgTax} style={{ fontSize: 12, color: Theme.theme}} />
                    </View>:null}
                    {
                        data.CurrencyInfo && data.CurrencyInfo.Currency!='CNY'?
                            <View style={{flexDirection:'row',alignItems:'flex-end'}}>
                                <CustomText text={'¥'} style={{fontSize:14, marginTop:5, fontWeight: 'bold', color: Theme.theme}}></CustomText>
                                <Text allowFontScaling={false} style={{ marginRight: 2, color: Theme.theme, fontSize: 20 }}>{'≈'}</Text>
                                <Text allowFontScaling={false} style={{ marginRight: 10, color: Theme.theme, fontSize: 15 }}>{data.AvgPrice}</Text>
                            </View>
                        :null
                    }
                    
                    <View style={{ alignItems:'flex-end' }}>
                    {Util.Parse.isChinese() ?
                               <View style={{ alignItems: 'center', justifyContent: 'center'}}>
                                    {    
                                        StarRateLimit || AdvanceDayLimit ||(this.state.LimitPrice!=0 && this.state.LimitPrice < data.AvgPrice) ?
                                        <TouchableOpacity onPress={()=>this._alert(StarRateLimit,AdvanceDayLimit,this.state.LimitPrice!=0 && this.state.LimitPrice < data.AvgPrice)}>
                                            <CustomText text='违背' style={styles.ruleStyle} />
                                        </TouchableOpacity>:null
                                    }
                                </View>
                                : null
                    }
                </View>
                </View>
                <View style={{ borderRadius:4}}>
                    <View style={{
                        flex: 2, 
                        padding:2,
                        alignItems:'center',
                        justifyContent:'center',
                        borderTopRightRadius:4 ,
                        borderTopLeftRadius:4 ,
                        backgroundColor: isHighRisk || hasViolation || DisableBook ? 'gray' : Theme.theme
                        }}>
                        <CustomText text={data.Status === 3?
                                                           '订 完'
                                                           :
                                                           '预 订'
                                                        } 
                        style={{ color:'#fff',fontSize:14,paddingHorizontal:5,}} /> 
                    </View>
                    <View style={{
                        flex: 2, 
                        padding:2,
                        alignItems:'center',
                        justifyContent:'center',
                        borderBottomRightRadius:4 ,
                        borderBottomLeftRadius:4 ,
                        borderColor:isHighRisk || hasViolation || DisableBook ? 'gray' : Theme.theme,
                        borderWidth:1,
                        marginTop:-1,
                        }}>
                    <CustomText text={data.PaymentType === 1 ? '到付' : '预付'} style={{ color:Theme.theme,fontSize:12}} /> 
                    </View> 
                    <View style={{ alignItems:'flex-end' }}>
                        {Util.Parse.isChinese() ? null :
                                <View style={{ alignItems: 'center', justifyContent: 'center'}}>
                                    {    
                                        StarRateLimit || AdvanceDayLimit ||(this.state.LimitPrice!=0 && this.state.LimitPrice < data.AvgPrice) ?
                                        <TouchableOpacity onPress={()=>this._alert(StarRateLimit,AdvanceDayLimit,this.state.LimitPrice!=0 && this.state.LimitPrice < data.AvgPrice)}>
                                            <CustomText text='违背' style={styles.ruleStyle} />
                                        </TouchableOpacity>:null
                                    }
                                </View>
                        }
                    </View>      
                </View>
            </TouchableOpacity>
            :
            <TouchableOpacity style={{ marginLeft:10,flexDirection:'row',alignItems:'center'}} 
                            underlayColor='transparent'
                            onPress={()=>{ 
                                if (data.Status === 3) return;
                                if (DisableBook) {
                                    this.toastMsg("暂无预订权限，请联系差旅顾问");
                                    return;
                                }
                                this.toastMsg("请选择申请单预订"); 
                            }}
            >
                <View style={{flexDirection:'column'}}>
                {data.CurrencyInfo&&<View style={{flexDirection:'row'}}>    
                <Text allowFontScaling={false} style={{ marginTop: 10, color: Theme.theme, fontSize: 18 ,fontWeight:'bold'}}>{data.CurrencyInfo.PriceList.AvgPrice}</Text>
                <Text allowFontScaling={false} style={{ marginRight: 3, marginTop: 13, color: Theme.theme, fontSize: 13 }}>{data.CurrencyInfo.Currency}</Text>
                {data.CurrencyInfo?.PriceList?.AvgTax?<CustomText text='(含税)' style={{ fontSize: 12, marginTop: 13, color: Theme.theme}} />:null}
                </View>}
                {data.CurrencyInfo?.PriceList?.AvgTax?<View style={{flexDirection:'row',marginRight: 10}}>
                        <CustomText text='税费' style={{ fontSize: 12, color: Theme.theme,marginRight: 3}} />
                        <Text allowFontScaling={false} style={{ marginRight: 3, color: Theme.theme, fontSize: 11 }}>{data.CurrencyInfo.Currency}</Text>
                        <CustomText text={data.CurrencyInfo?.PriceList?.AvgTax} style={{ fontSize: 12, color: Theme.theme}} />
                    </View>:null}
                {
                  data.CurrencyInfo && data.CurrencyInfo.Currency!='CNY'?
                    <View style={{flexDirection:'row'}}>
                        <Text allowFontScaling={false} style={{ marginRight: 5, color: Theme.theme, fontSize: 14 }}>{'≈'}</Text>
                        <Text allowFontScaling={false} style={{ marginRight: 10, color: Theme.theme, fontSize: 14 }}>{data.AvgPrice+'￥'}</Text>
                    </View>:null
                }
                <View style={{ alignItems:'flex-end' }}>
                {Util.Parse.isChinese() ?
                        StarRateLimit || AdvanceDayLimit ||(this.state.LimitPrice!=0 && this.state.LimitPrice < data.AvgPrice) ?
                        <TouchableOpacity onPress={()=>this._alert(StarRateLimit,AdvanceDayLimit,this.state.LimitPrice!=0 && this.state.LimitPrice < data.AvgPrice)}>
                            <CustomText text='违背' style={styles.ruleStyle} />
                        </TouchableOpacity>:null
                        : null
                }
                </View>
                </View>
                <View style={{ borderRadius:4}}>
                <View style={{
                    flex: 2, 
                    padding:2,
                    alignItems:'center',
                    justifyContent:'center',
                    borderTopRightRadius:4 ,
                    borderTopLeftRadius:4 ,
                    backgroundColor: 'gray'
                                            
                    }}>
                    <CustomText text={data.Status === 3?
                                                        '订 完'
                                                        :
                                                        '预 订'
                                                    } 
                    style={{ color:'#fff',fontSize:14,paddingHorizontal:5}} /> 
                </View>
                <View style={{
                    flex: 2, 
                    padding:2,
                    alignItems:'center',
                    justifyContent:'center',
                    borderBottomRightRadius:4 ,
                    borderBottomLeftRadius:4 ,
                    borderColor:'gray',
                    borderWidth:1,
                    marginTop:-1,
                    }}>
                <CustomText text={data.PaymentType === 1 ? '到付' : '预付'} style={{ color:Theme.theme,fontSize:12}} /> 
                </View> 
                    <View style={{ alignItems:'flex-end' }}>
                    {Util.Parse.isChinese() ? null :
                            <View style={{ alignItems: 'center', justifyContent: 'center'}}>
                                {    
                                    StarRateLimit || AdvanceDayLimit ||(this.state.LimitPrice!=0 && this.state.LimitPrice < data.AvgPrice) ?
                                    <TouchableOpacity onPress={()=>this._alert(StarRateLimit,AdvanceDayLimit,this.state.LimitPrice!=0 && this.state.LimitPrice < data.AvgPrice)}>
                                        <CustomText text='违背' style={styles.ruleStyle} />
                                    </TouchableOpacity>:null
                                }
                            </View>
                    } 
                    </View>     
                </View>
                </TouchableOpacity>
            }
        </View>
        )

    }
    _renderListHeader = () => {
        if (!this.state.isLoading) return null;
         
        return (
            <View style={{ padding: 10, alignItems: 'center' }}>
                <ActivityIndicator size={'large'} color={Theme.theme} />
                <CustomText text='loading...' style={{ color: Theme.theme, marginTop: 5 }} />
            </View>
        )
    }
    _renderHeader = () => {
        const { hotel,customerInfo } = this.params;
        const { selectDate, longDay, isVisible, isVisible2,bedTypeGroup } = this.state;
        let liveDate = selectDate.addDays(longDay);
        let imageArr = [];
        let allImageArr = [];
        let imageNum = 0
        if (this.state.roomDetail) {
            if(this.state.roomDetail.Images != null &&this.state.roomDetail.Images.length>=10){
                imageArr = this.state.roomDetail.Images.slice(0,10);
            }else {
                imageArr = this.state.roomDetail.Images
            }
            allImageArr = this.state.roomDetail.Images;
            imageNum =this.state.roomDetail.Images? this.state.roomDetail.Images.length:0; 
        }

        let HotelName = hotel.HotelName&& hotel.HotelName.length > 13?hotel.HotelName.substr(0, 13) + '...':hotel.HotelName;
        let HotelNameEn =hotel.HotelNameEn&& hotel.HotelNameEn.length > 23?hotel.HotelNameEn.substr(0, 23) + '...':hotel.HotelNameEn;
        let starArr = []
        for (let i = 0; i<hotel.StarRate ; i++){
            starArr.push(i);
        }
        return (
            <View>
                <View >
                    {imageArr && imageArr.length > 0 ? <Swiper
                            autoplay={true}
                            style={{height:global.screenWidth/5*3}}
                            borderRadius={3}
                            dotStyle={{width:0,height:0}}
                            activeDotStyle={{width:0,height:0}}
                            >
                            {imageArr.map((item, index) => {
                                return (
                                    <TouchableOpacity
                                       key={index}
                                       onPress={() => {this.push('HotelRoomPic',allImageArr) }}
                                    >
                                        <ImageBackground
                                            source={{
                                            uri:item.Url,
                                            }}
                                            resizeMode={'stretch'}
                                            style={{width: global.screenWidth ,height: global.screenWidth/5*3}}
                                            key={index}
                                        >
                                        <View style={styles.imageStyle}>
                                            <Ionicons name={'images'} size={14} style={{color:'#fff'}} />
                                            <Text style={{color:'#fff',marginLeft:2,fontSize:12}}>{imageNum}</Text>
                                        </View>
                                        </ImageBackground>
                                </TouchableOpacity>
                                );
                                    
                                })}
                            </Swiper>:
                            <ImageBackground
                                source={hotel.CoverImage ? { uri: hotel.CoverImage } : require('../../res/image/replaceFcm.jpeg')}
                                resizeMode={'stretch'}
                                style={{ width: global.screenWidth, height: global.screenWidth / 5 * 3 }}
                            >
                                <View style={styles.imageStyle}>
                                    <Ionicons name={'images'} size={14} style={{ color: '#fff' }} />
                                    <Text style={{ color: '#fff', marginLeft: 2, fontSize: 12 }}>{imageNum}</Text>
                                </View>
                            </ImageBackground>

                    }
                </View>
                <View style={{backgroundColor:'#fff',marginTop:-15,borderTopRightRadius:15,borderTopLeftRadius:15}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', margin: 15, marginTop: 25, marginBottom: 10, justifyContent: 'space-between'}}>    
                        <View style={{flex:1}} >
                            <View style={{alignItems:'baseline'}}>
                                <CustomText text={Util.Parse.isChinese()?HotelName:HotelNameEn } style={{ fontSize:14,fontWeight:'bold'}} ellipsizeMode='tail'  />
                                {
                                  starArr.length>0?
                                    <View style={{ flexDirection: 'row' }}>
                                        {  
                                            starArr.map(()=>{
                                                return<Image style={{height:14,width:14,marginRight:2,marginTop:5}} source={require('../../res/Uimage/hotelFloder/_star.png')}></Image>
                                            }) 
                                        }
                                    </View>
                                    :null
                                }
                            </View>
                             {/* {Util.Parse.isChinese() &&  (hotel.HotelNameEn&&hotel.HotelNameEn != HotelName) ? <CustomText text={'('+hotel.HotelNameEn+')'} style={{ fontSize:13,color:'gray'}} ellipsizeMode='tail'  />:null} */}
                            {this.state.roomDetail&&this.state.roomDetail.OpenDate&&<CustomText text={`${I18nUtil.translate('开业时间：')}`+this.state.roomDetail.OpenDate} style={{fontSize:13,color:Theme.aidFontColor,marginTop:5}} />}
                        </View>
                        <TouchableOpacity style={{ alignItems: 'center', flexDirection: 'row' ,marginLeft:10}}
                            onPress={this._hotelDetailBtnClick}
                        >
                            <CustomText text='详情' style={{ fontSize: 14, color: Theme.theme }} />
                            <AntDesign name={'right'} size={14} color={Theme.theme} />
                        </TouchableOpacity>
                    </View>
                    {/* <View style={{flexDirection:'row',marginLeft:15,alignItems:'center'}}>
                        <CustomText style={{ color: Theme.theme, fontSize: 12 }} text='好评率' />
                        <CustomText style={{ color: Theme.theme, fontSize: 12 }} text='：' />
                        <CustomText text={hotel.CommentScore ? (hotel.CommentScore * 100) + '%' : '暂无评论'} style={{fontSize:12,color:Theme.theme}} />
                        <CustomText text={hotel.CommentScore ?'  评分来自各大平台平均分数':''} style={{fontSize:13,color:Theme.aidFontColor}} />
                    </View> */}
                    <TouchableOpacity style={{marginTop:8}} onPress={this._toMap}>
                            <ImageBackground source={require('../../res/Uimage/hotelFloder/_mapBg.png')}
                                            style={{ marginHorizontal:10, justifyContent:'space-between',flexDirection:'row',paddingHorizontal:10,alignItems:'center',height:64}}
                                            imageStyle={{borderRadius:4}}>
                                            {/* <CustomText text={hotel.Address} style={{fontSize:13,fontSize:15,margin:15,width:300}} /> */}
                                            <View style={{width:270}}>
                                                <CustomText text={ this.state.roomDetail && this.state.roomDetail.Address ? this.state.roomDetail.Address : hotel.Address ? hotel.Address : null } 
                                                            style={{ fontSize: 13,color:Theme.assistFontColor}} 
                                                /> 
                                                {/* <CustomText text={location && location.Description} style={{ fontSize: 13, color: Theme.aidFontColor,marginTop:5  }} /> */}
                                            </View>
                                            <Image source={require('../../res/Uimage/hotelFloder/_loc.png')} style={{ width: 28, height: 28 }} />
                            </ImageBackground>
                       
                    </TouchableOpacity>
                    <View style={{marginVertical:6}}>
                        <View style={styles.dateStyle}>
                            <View>
                                <CustomText text='入住' style={{fontSize:12,color:Theme.aidFontColor}} />
                                <CustomText text={selectDate.format('MM/dd')} style={{fontSize:17,}} /> 
                            </View>
                            <View style={{height:1,width:80,backgroundColor:Theme.theme}}/>
                            <View style={{height: 20, borderRadius: 2, borderWidth: 0.5, borderColor: Theme.theme, alignItems: 'center', justifyContent: 'center',backgroundColor:Theme.greenBg }}>
                                <CustomText text={longDay+'晚'} style={{fontSize: 13, fontSize: 13, color: Theme.theme, padding: 2.5,paddingHorizontal:4}} />
                            </View>
                            <View style={{height:1,width:80,backgroundColor:Theme.theme}}/>
                            <View>
                                <CustomText text='离店' style={{fontSize:12,color:Theme.aidFontColor}} />
                                <CustomText text={liveDate.format('MM/dd')} style={{fontSize:17,}} /> 
                            </View>
                            {/* <CustomText text='修改日期 &gt;' style={{fontSize:13,fontSize:15,color:Theme.theme}} />  */}
                        </View>
                        <View style={{flexDirection: 'row', paddingLeft: 15, flexWrap: 'wrap',paddingBottom:15,borderBottomWidth:6,borderColor:Theme.normalBg}}>
                            <TouchableOpacity style={{minWidth: Util.Parse.isChinese() ? screenWidth / 6 : null, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 0.7, borderRadius: 3, borderColor: this.state.selectEligibility ? Theme.theme : 'gray',backgroundColor:this.state.selectEligibility ? Theme.greenBg : '#fff', marginVertical: 5, marginRight: 5, padding: 4}} 
                                            onPress={
                                                this._selectFilterFunc.bind(this,'selectEligibility',this.state.LimitPrice)
                                            }>
                                <CustomText text='符合城市标准' style={{fontSize:14,color:this.state.selectEligibility?Theme.theme:'gray'}} />
                            </TouchableOpacity>
                            <TouchableOpacity style={{minWidth: Util.Parse.isChinese() ? screenWidth / 6 : null, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 0.7, borderRadius: 3, borderColor: this.state.selectAgreement ? Theme.theme : 'gray',backgroundColor:this.state.selectAgreement ? Theme.greenBg : '#fff', marginVertical: 5, marginRight: 5, padding: 4}} 
                                            onPress={
                                                this._selectFilterFunc.bind(this,'selectAgreement')
                                            }>
                                <CustomText text='协议价' style={{fontSize:14,color:this.state.selectAgreement?Theme.theme:'gray'}} />
                            </TouchableOpacity>
                            <TouchableOpacity style={{minWidth: Util.Parse.isChinese() ? screenWidth / 6 : null, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 0.7, borderRadius: 3, borderColor: this.state.selectBreakfast ? Theme.theme : 'gray',backgroundColor:this.state.selectBreakfast ? Theme.greenBg : '#fff', marginVertical: 5, marginRight: 5, padding: 4}} 
                                            onPress={
                                                this._selectFilterFunc.bind(this,'selectBreakfast')
                                            }>
                                <CustomText text='含早餐' style={{fontSize:14,color:this.state.selectBreakfast?Theme.theme:'gray'}} />
                            </TouchableOpacity>
                            
                            <Popover 
                                backgroundStyle={{backgroundColor:'rgba(52, 52, 52, 0.3)'}}
                                popoverStyle = {{borderColor:'gray'}}
                                arrowStyle = {{borderWidth:2}}
                                placement={PopoverPlacement.BOTTOM}
                                isVisible={isVisible}
                                from={(sourceRef, showPopover) => (
                                
                                    <TouchableOpacity style={{minWidth: Util.Parse.isChinese() ? screenWidth / 6 : null, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 0.7, borderRadius: 3, borderColor: this.state.paySwich ? Theme.theme : 'gray',backgroundColor:this.state.paySwich ? Theme.greenBg : '#fff', marginRight: 5, padding: 4,marginVertical: 5}} 
                                                    onPress={
                                                        ()=>{
                                                            this.setState({
                                                                isVisible:!this.state.isVisible
                                                            })
                                                        }
                                                    }
                                    ><CustomText text={this.state.paySwich?this.state.paySwich:'支付方式'} style={{fontSize:14,color:this.state.paySwich?Theme.theme:'gray'}} /></TouchableOpacity>
                                    
                                )}>
                                <View style={{padding:3, width: screenWidth / 5 + 20, borderColor: Theme.lineColor,}}>
                                {
                                    customerInfo.Setting.HotelCorpPaymentType != 1 ?
                                        <TouchableOpacity onPress={this._selectFilterFunc.bind(this,'payType2')}   style={{alignItems:'center'}}>
                                            <CustomText text={'预付'} style={{color:Theme.darkColor,paddingTop:10}}></CustomText>
                                        </TouchableOpacity>
                                    :null
                                }
                                {
                                    customerInfo.Setting.HotelCorpPaymentType != 2 ?
                                        <TouchableOpacity onPress={this._selectFilterFunc.bind(this,'payType1')}
                                                            style={{marginTop:5,alignItems:'center'}}>
                                            <CustomText text={'到付'} style={{color:Theme.darkColor,paddingTop:10}}></CustomText>
                                        </TouchableOpacity>
                                    :null
                                }
                                <TouchableOpacity onPress={this._selectFilterFunc.bind(this,'payType3')}
                                                    style={{marginTop:5,alignItems:'center'}}>
                                    <CustomText text={'不限'} style={{color:Theme.darkColor,paddingVertical:10}}></CustomText>
                                </TouchableOpacity>
                                </View>
                            </Popover>
                            <Popover 
                                backgroundStyle={{backgroundColor:'rgba(52, 52, 52, 0.3)'}}
                                popoverStyle = {{borderColor:'gray'}}
                                arrowStyle = {{borderWidth:2}}
                                isVisible={isVisible2}
                                placement={PopoverPlacement.BOTTOM}
                                from={(sourceRef, showPopover) => (
                                    <TouchableOpacity style={{minWidth: Util.Parse.isChinese() ? screenWidth / 6 : null, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 0.7, borderRadius: 3, borderColor: this.state.bedSwich ? Theme.theme : 'gray',backgroundColor:this.state.bedSwich ? Theme.greenBg : '#fff', padding: 4,marginVertical: 5}} 
                                                    onPress={
                                                        ()=>{
                                                            this.setState({
                                                                isVisible2:!this.state.isVisible2
                                                            })
                                                        }
                                                    }
                                    ><CustomText text={this.state.bedSwich?this.state.bedSwich:'床型'}style={{fontSize:14,color:this.state.bedSwich?Theme.theme:'gray'}} /></TouchableOpacity>
                                )}>
                                <ScrollView 
                                    style={{ padding: 3, width: screenWidth / 6 + 10, borderColor: Theme.lineColor, }}
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps='always'
                                    nestedScrollEnabled={true}
                                >
                                    {
                                        bedTypeGroup?.map((item, index) => {
                                            return(
                                                <TouchableOpacity key={index} style={{ color: Theme.darkColor,paddingTop:2, alignItems: 'center' }}
                                                    onPress={this._selectFilterFunc.bind(this, 'bedType', item)}
                                                >
                                                    <CustomText text={item} style={{ color: Theme.darkColor,paddingVertical:6 }}></CustomText>
                                                </TouchableOpacity>
                                            )
                                        })
                                    }
                                    <TouchableOpacity onPress={this._selectFilterFunc.bind(this, 'bedType1')}
                                        style={{ marginTop: 5, alignItems: 'center' }}>
                                        <CustomText text={'不限'} style={{ color: Theme.darkColor,paddingVertical:10 }}></CustomText>
                                    </TouchableOpacity>
                                </ScrollView>
                            </Popover>
                            
                        </View>
                    </View>

                  

                </View>
            </View>
        )
    }
    _renderFooter = () => {
        const { roomListArrs } = this.state; 
        return (
            <View>
                <View style={{height:200,justifyContent:'center',alignItems:'center'}}>
                    <CustomText style={{color:Theme.darkColor}} text = {roomListArrs.length==0&&this.state.OnOff?'没有符合您查询条件的内容':''}/>
                </View>   
            </View>
        )
    }
  async _selectFilterFunc(type,value){
        const { roomList } = this.state;
        this.setState({
            OnOff:true,
            isVisible:false,
            isVisible2:false,
        })

        if (type == 'selectEligibility') {//是否符合差标
               await this.setState({
                    selectEligibility:!this.state.selectEligibility
                })
        }
        if (type == 'selectAgreement') {//协议价
            await this.setState({
                selectAgreement:!this.state.selectAgreement
            })
           
        }
        if (type == 'selectBreakfast') {//含早餐
            await this.setState({
                selectBreakfast:!this.state.selectBreakfast
            })  
        }
        if (type == 'payType1') {//支付方式 
            await this.setState({
                paySwich:'到付'
            })  
        }
        if (type == 'payType2') {//支付方式
            await this.setState({
                paySwich:'预付'
            })  
        }
        if (type == 'payType3') {//支付方式
            await this.setState({
                paySwich:''
            })  
        }
        if (type == 'bedType') {//房型
            await this.setState({
                bedSwich: value
            })
        }
        if (type == 'bedType1') {//房型
            await this.setState({
                bedSwich: ''
            })
        }
        let roomListCopy =[];
        roomListCopy = JSON.parse(JSON.stringify(roomList))//序列化反序列化法拷贝
       let arrs= roomListCopy.map((items, i) => {
            let newarr =[]
            let showLowes = []//最低价格
            let arrT = [];//三方协议价
            let min;//三方协议价最低价格
            newarr = items.waitData

            if(this.state.selectBreakfast){//筛选含早餐的
                newarr = newarr.filter(item=>{
                    return item.Breakfast > 0
                })
            }
            if(this.state.selectEligibility){//筛选符合差标的
                newarr = newarr.filter(item=>{
                    return item.AvgPrice <= value
                })
            }
            if(this.state.selectAgreement){
                // newarr = newarr.filter(item=>{//筛选协议价的
                //     return item.Channel != 'sohoto' && item.Channel != 'elong' && item.Channel != 'meituan'
                // })
                newarr = newarr.filter(item => {//筛选协议价的
                    let label;
                    item.RpLabel && item.RpLabel.map(obj=>{
                        
                        if(obj === '2SAgreement' || obj ==='价格计划2S协议'){
                            label = 'FCM';
                        }else if (obj === '3SAgreement' || obj ==='价格计划3S协议') {
                            label = Util.Parse.isChinese()?'协议':'Corp';
                        }else{
                            label = ''
                        }
                    })
                    return label ==='协议'|| label ==='Corp'
                })
            }
            if(this.state.paySwich){//筛选支付方式
                if(this.state.paySwich==='到付'){
                    newarr = newarr.filter(item=>{
                        return item.PaymentType===1
                    })
                }
                if(this.state.paySwich==='预付'){
                    newarr = newarr.filter(item=>{
                        return item.PaymentType===2
                    })
                }
            }
            if(this.state.bedSwich){//筛选房型
                newarr = newarr.filter(item => {
                    return item.BedTypeGroup != null && item.BedTypeGroup.indexOf(this.state.bedSwich) > -1;
                })
            }
            if(newarr.length > 0){
                let lowPrice;
               newarr.forEach(obj=>{
                   if(!lowPrice){
                       lowPrice = obj.TotalPrice;
                   }
                    if(lowPrice > obj.TotalPrice){
                        lowPrice = obj.TotalPrice;
                    }
               })
               items.LowRate = lowPrice;
           }
                
            // items.waitData = newarr
            //找到items.waitData数组中TotalAmount最小的类
            showLowes = newarr.filter(item => {
                return item.TotalAmount == Math.min.apply(null, newarr.map(item => item.TotalAmount))    
            })
            
            newarr.map(item => {
                if (item.RpLabel) {
                    item.RpLabel && item.RpLabel.map(_item=>{
                        if (_item.RpLabel === '3SAgreement' || _item ==='价格计划3S协议') {
                            arrT.push(item);
                        }
                    })
                }
            })

            // 取出arrT中TotalAmount最小的值
            let arr = []
            if (arrT && arrT.length > 0) {
               //取出arrT里面TotalAmount最小的类
               min = arrT.reduce((prev, current) => prev.TotalAmount < current.TotalAmount ? prev : current);
               arr = arrT.filter(item => item.TotalAmount === min.TotalAmount);
               min = arr[0];
            }
            
            // 判断showLowes[0] 是不是和min 的RatePlanCode相等
            if (min) {
                if (showLowes[0] && showLowes[0].RatePlanCode === min.RatePlanCode) {
                    showLowes = [min]
                } else {
                    if(min.TotalAmount <= showLowes[0].TotalAmount){
                        showLowes = [min]
                    }else{
                        showLowes = [showLowes[0],min]
                    }
                }
                // newarr去掉最低价格的，然后重新排序
                let roomList = newarr.filter(item => !showLowes.some(low => low.RatePlanCode === item.RatePlanCode));
                items.waitData = [...showLowes, ...roomList];
            }else{
                if(showLowes&&showLowes.length>1){
                    showLowes=[showLowes[0]];
                }
                items.waitData = newarr
            }
            items.data = showLowes;
            return items
        })
        arrs = arrs.filter(item=>{//当子房间都不符合标准时，不显示
            return item.waitData&&item.waitData.length>0
        }) 
        this.setState({
            roomListArrs:arrs
        })    
     
    }
}
const getStatePorps = state => ({
    compSwitch: state.compSwitch.bool,
    compCreate_bool: state.compCreate_bool.bool,
    comp_checkTravellers: state.comp_checkTravellers.travellers,
    comp_travelers: state.comp_travelers.travellers,
    highRisk:state.highRisk.highRisk,
    customerInfo_userInfo:state.customerInfo_userInfo,
    apply:state.apply.apply,
    comp_userInfo:state.comp_userInfo,
})
const getAction = dispatch => ({
    loadHotelCanselRule:(value)=>dispatch(action.loadHotelCanselRule(value)),
})
export default connect(getStatePorps,getAction)(InterHotelRoomListScreen);
const styles = StyleSheet.create({
    imageStyle:{
        height:20,
        width:50,
        flexDirection:'row',
        alignItems:"center",
        justifyContent:'center',
        backgroundColor:'rgba(1,1,1,0.5)',
        position:'absolute',
        bottom:25,
        right:15,
        borderRadius:15,
    },
    imageItemStyle:{
        height:18,
        width:45,
        flexDirection:'row',
        alignItems:"center",
        justifyContent:'center',
        backgroundColor:'rgba(1,1,1,0.5)',
        position:'absolute',
        bottom:5,
        right:15,
        borderRadius:15,
    },
    chooseStyle:{
        width:screenWidth/6,
        height:24,
        alignItems:'center',
        justifyContent:'center',
        borderWidth:0.7,
        borderRadius:3,
        borderColor:'gray'

    },
    fontStyles:{fontSize:14,color:'gray'},
    dateStyle:{
        flexDirection:'row',
        alignItems:'center',
        justifyContent:"space-between",
        padding:20,
        paddingTop:20,
        // borderBottomWidth:6,
        borderColor:Theme.lineColor,
        borderTopWidth: 6,
        borderColor: Theme.normalBg
        
    },
    listLitleItemStyle:{ 
        borderBottomColor:Theme.lineColor,
        borderBottomWidth: 1,
        marginHorizontal: 10,
        marginBottom:6,
        backgroundColor:'#fff',
        borderRadius:4
    },
    textSt:{
        fontSize:13,
        color:Theme.darkColor
    },
    container2:{
        flex:1,
        backgroundColor:'rgba(0, 0, 0, 0.4)',
        justifyContent:'center',
        alignItems:'center'
    },
    popStyle:{height:500,
        backgroundColor:'#fff',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0
    },
    // textViewSt:{width:screenWidth/2-30,flexDirection:'row',marginBottom:15},
    ruleStyle: { fontSize: 12, color: 'red', marginRight: 5, height: 15,backgroundColor:Theme.redColor,color:'#fff',paddingHorizontal:5,borderRadius:2},
    textViewSt: { width: Util.Parse.isChinese() ? screenWidth / 2 - 30 : null, paddingRight: 10, flexDirection: 'row', marginBottom: 15, flexWrap: 'wrap',alignItems:'center' }


    
})