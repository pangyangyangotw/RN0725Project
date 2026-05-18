import React from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableHighlight,
    TouchableOpacity,
    DeviceEventEmitter,
    InteractionManager
} from 'react-native';
import SuperView from '../../super/SuperView';
import HeaderView from './HeaderView';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PriceDetailView from './PriceDetailView';
import OrderSureBottom from '../common/OrderSureBottom';
import PassengerSureView from '../common/PassengerSureView';
import { connect } from 'react-redux';
import Action from '../../redux/action/index';
import FlightService from '../../service/FlightService';
import Util from '../../util/Util';
import ViewUtil from '../../util/ViewUtil';
import NavigationUtils from '../../navigator/NavigationUtils';
import BackPress from '../../common/BackPress';
import RuleView from './RuleView';
import RuleView2 from './RuleView2';
import SumbitOrderTipView from './SumbitOrderTipView';
import ComprehensiveService from '../../service/ComprehensiveService';
import Touchable from '../../util/TouchableUtil';
import CommonService from '../../service/CommonService';
import InflFlightService from '../../service/InflFlightService';
import  LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';

class FlightOrderSureScreen extends SuperView {
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
            showPriceDetail: false,
            isStop: false,
            DomesticFlightsList: [],
            IgnoreConfirm: 0,
            checkData:null,
            BeginTime:null,
            EndTime:null,
            goCityDisplay:null,
            arrivalCityDisplay:null,
            TermsAgreement:[],
            lastData:null,
            showContinuAlert:false

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
        const {isStop,showContinuAlert,lastData} = this.state;
        if (!isStop) {
            this.pop();
            if(this.state.showPriceDetail){
                this.setState({
                    showPriceDetail: false
                }, () => {
                    this.priceDetailView && this.priceDetailView.hide();
                })
            }
        }else if(showContinuAlert){
            this.push('FlightOrderList');
        }else if(lastData){
            DeviceEventEmitter.emit('freshCompDetail', {orderId: lastData.Id, isStop:true});
            this.push('CompDetailScreen', { orderId: lastData.Id, isStop:true });
        }
        return true;
    }

    _LeftTitleBtn(){
        this.pop();
    }

    componentDidMount() {
        const { apply } = this.props;
        const {arrivalCityData,isSingle,goCityData,moreTravel} = this.params
        this.backPress.componentDidMount();
        if(apply&&apply.BusinessCategory&4){
                if(apply.Destination&&apply.Destination.DepartureList&&apply.Destination.DepartureList.length>0){
                    this.setState({
                        BeginTime:apply.Destination.BeginTime,
                        EndTime:apply.Destination.EndTime,
                    },()=>{
                        this._commonCity1(apply.Destination.DepartureList[0].Name);
                        this._commonCity2(apply.Destination.DestinationList[0].Name);
                    })
                }else if(apply.JourneyList){
                    this.setState({
                        BeginTime:apply.JourneyList[0].BeginTime,
                        EndTime:apply.JourneyList[0].EndTime,
                    },()=>{
                        let jList = apply.JourneyList&&apply.JourneyList[0]&&apply.JourneyList[0]
                        this._commonCity1(jList&&jList.Departure);
                        this._commonCity2(jList&&jList.Destination);
                    })
                }
        }else{
            this._commonCity2(//单程和多程用到达城市arrivalCityData,往返用去程用goCityData,
                (isSingle||moreTravel)?arrivalCityData.Name:
                goCityData.Name
            );
        }

        let airArr = [];
        airArr.push(this.params.goFlightData.AirCode)
        if(this.params.backFlightData){
            airArr.push(this.params.backFlightData.AirCode)
        }
        let model = {
            AirlineCodes:airArr,
            NationalType:1//国内
        }
        let TermsAgreeArr = []; 
        
        this.showLoadingView()
        InflFlightService.CommonAirline(model).then(response => {
            this.hideLoadingView()  
            if (response && response.success && response.data &&response.data.length>0) {
                response.data.map((item)=>{
                    item.TermsAgreement&&item.TermsAgreement.map((obj)=>{
                        if(obj.Type != 2){
                            TermsAgreeArr.push(obj);
                        }
                    })
                })
                this.setState({
                    TermsAgreement:TermsAgreeArr
                })
           }else{
            this.toastMsg(response.message);
           }
        }).catch(error => {
            this.hideLoadingView()
            this.toastMsg(error.message || '加载数据失败请重试');
        })
    }
    
    _commonCity1 = (item) =>{
        let model = {
            Keyword: item,
            Domestic:''
        }
        CommonService.CommonCity(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if (response.data && response.data) {
                    response.data.map((obj)=>{
                        if(obj.Name == item.replace('市','') ){
                           this.setState({
                            goCityDisplay:obj
                           })
                        }
                    })
                }
            } else {
                this.toastMsg(response.message || '获取数据失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }

    _commonCity2 = (item) =>{
        let model = {
            Keyword: item,
            Domestic:''
        }
        CommonService.CommonCity(model).then(response => {
            if (response && response.success) {
                if (response.data && response.data) {
                    response.data.map((obj)=>{
                        if(obj.Name == item.replace('市','') ){
                            this.setState({
                                arrivalCityDisplay:obj
                            })
                        }
                    })
                }
            } else {
                this.toastMsg(response.message || '获取数据失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }
    componentWillUnmount() {
        super.componentWillUnmount();
        this.backPress.componentWillUnmount();
    }
    _showPriceDetail = () => {
        if (this.state.showPriceDetail) {
            this.setState({
                showPriceDetail: false
            }, () => {
                this.priceDetailView.hide();
            })

        } else {
            this.setState({
                showPriceDetail: true
            }, () => {
                this.priceDetailView.show();
            })
        }
    }

    _serviseFee = () => {
        const { customerInfo, employees, travellers, backFlightData, goFlightData, feeType } = this.params;
        const { ServiceFeesData } = this.params;
        let IsShowServiceFee =  ServiceFeesData && ServiceFeesData.IsShowServiceFee
        if (!IsShowServiceFee) {
            return;
        }
        let vip = 0;
        let pub = 0;
        // let baseAmount = (goFlightData.Price + goFlightData.Tax);
        let baseAmount = (goFlightData?.Price ?? 0) + (goFlightData?.Tax ?? 0);
        if (backFlightData) {
            // baseAmount += (backFlightData.Price + backFlightData.Tax)
            baseAmount += (backFlightData?.Price ?? 0) + (backFlightData?.Tax ?? 0);
        }
        employees.forEach(item => {
            if (item.IsVip) {
                vip++;
            } else {
                pub++;
            }
        })
        travellers.forEach(item => {
            if (item.IsVip) {
                vip++;
            } else {
                pub++;
            }
        })
        var serviceFee = 0;
        var VipServiceFee = 0;
        ServiceFeesData && ServiceFeesData.ServiceFees && ServiceFeesData.ServiceFees.map((item, index) => {
            if (item.FeeValueType == 1) {
                if (ServiceFeesData && ServiceFeesData.TollType == 3 && backFlightData) {
                    serviceFee += Number(item.Price * item.CountOfShowDetail);
                }else{
                    serviceFee += Number(item.Price)
                }
            }
            else if (item.FeeValueType == 2) {
                let baseAmount1= baseAmount
                    if(backFlightData){
                        // baseAmount1 = baseAmount+(backFlightData.Price+ backFlightData.Tax)
                        baseAmount1 = baseAmount+(backFlightData?.Price ?? 0)+(backFlightData?.Tax ?? 0)
                    }
                item.Price = Number((item.FeeValue * baseAmount1).toFixed(2));
                serviceFee += item.Price
            }
        })

        ServiceFeesData && ServiceFeesData.VipServiceFees.map((item, index) => {
            if (item.FeeValueType == 1) {
                if (ServiceFeesData && ServiceFeesData.TollType == 3 && backFlightData) {
                    VipServiceFee += Number(item.Price * item.CountOfShowDetail);
                }else{
                    VipServiceFee += Number(item.Price)
                }
            }
            else if (item.FeeValueType == 2) {
                let baseAmount2= baseAmount
                if(backFlightData){
                    // baseAmount2 = baseAmount+(backFlightData.Price+ backFlightData.Tax)
                    baseAmount2 = baseAmount+(backFlightData?.Price ?? 0)+(backFlightData?.Tax ?? 0)
                } 
                item.Price = Number((item.FeeValue * baseAmount2).toFixed(2));
                VipServiceFee += item.Price;
            }
        })
        // return (ServiceFeesData && ServiceFeesData.IsShowServiceFee || feeType === 2) ? (VipServiceFee * vip).toFixed(2) : (serviceFee * pub).toFixed(2)
        return (ServiceFeesData && ServiceFeesData.IsShowServiceFee || feeType === 2) ? (VipServiceFee * vip+serviceFee * pub).toFixed(2):null
    }

    _orderBtnClick = () => {
        let journeyid = 0;
        const { apply } = this.props;
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
        this.requestModel.JourneyId = journeyid;
        this.requestModel.TravellerList.forEach((item) => {
            if(item.Certificate&&item.Certificate.Type == 1){
                item.Certificate.NationalCode = 'CN'
                item.Certificate.NationalName = '中国'
                item.Nationality = 'CN',
                item.NationalName = '中国'
                item.NationalCode = 'CN'
                item.Certificate.IssueNationCode = 'CN'
                item.Certificate.IssueNationName = '中国'

            }
        })
        let model = {
            data: JSON.stringify(this.requestModel)
        }
        console.log('model---',this.requestModel);
        this.tipView.show();
        FlightService.FlightorderCreate(model).then(response => {
            this.tipView.hide();
            if (response && response.success && response.data) {
                if (response.code == 201) {
                    this.push('FlightPayment', { SerialNumber: response.data.payment.SerialNumber?response.data.payment.SerialNumber:'' });
                } else {
                    this.showAlertView("订单生成成功,您可去我的订单中查看",()=>{
                        return ViewUtil.getAlertButton('取消', () => {
                            this.dismissAlertView();
                            NavigationUtils.popToTop(this.props.navigation);
                            InteractionManager.runAfterInteractions(() => {
                                DeviceEventEmitter.emit('deleteApply', {});
                            });
                        }, '确定', () => {
                            this.push('FlightOrderList');
                            this.dismissAlertView();
                        })
                    })
                    this.setState({
                        isStop: true,
                        // showContinuAlert:showContinuAlert,
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
                } else if (response.code == 4) {
                    // let str = I18nUtil.translate('Vip服务费') + response.data.VipServiceCharge + ',' + I18nUtil.translate('服务费') + response.data.ServiceCharge + I18nUtil.translate('您确定继续预订吗？');
                    // let str = I18nUtil.translate('服务费') + this._serviseFee() + I18nUtil.translate('您确定继续预订吗？');
                    // this.showAlertView(str, () => {
                    //     return ViewUtil.getAlertButton('取消', () => {
                    //         this.dismissAlertView();
                    //         this.pop();
                    //     }, '确定', () => {
                            this.requestModel.ServiceCharge = response.data.ServiceCharge;
                            this.requestModel.VipServiceCharge = response.data.VipServiceCharge;
                            this.dismissAlertView();
                            this._orderBtnClick();
                        // })
                    // })
                } else if (response.code == 8) {
                    this.showAlertView(response.message, () => {
                        return ViewUtil.getAlertButton('返回重新预订', () => {
                            this.dismissAlertView();
                            NavigationUtils.popToTop(this.props.navigation);
                        }, '继续预订', () => {
                            this.dismissAlertView();
                            if (response.data && response.data.length > 0) {
                                response.data.forEach(item => {
                                    if (item.Departure === this.requestModel.OrderAir.Departure && item.Destination === this.requestModel.OrderAir.Destination) {
                                        this.requestModel.OrderAir = item;
                                    }
                                    if (this.requestModel.OrderAirReturn) {
                                        if (item.Departure === this.requestModel.OrderAirReturn.Departure && item.Destination === this.requestModel.OrderAirReturn.Destination) {
                                            this.requestModel.OrderAirReturn = item;
                                        }
                                    }
                                })
                            }
                            this._orderBtnClick();
                        })
                    })
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
            this.tipView.hide();
            this.requestModel.IgnoreConfirm = 0;
            this.toastMsg(error.message || '提交订单失败出错,请重试!');
        })
    }


    _renderBottomView = () => {
        const { showPriceDetail } = this.state;
        const { customerInfo, totalPrice,ServiceFeesData } = this.params;
        const { compSwitch } = this.props;
        let isShowServiceCharge =   ServiceFeesData && ServiceFeesData.IsShowServiceFee;
        return (
            <View style={{ flexDirection: 'row', backgroundColor: 'white', alignItems: 'center' }}>
                <CustomText style={{ marginLeft: 20, color: Theme.theme, fontSize: 14,fontWeight:'bold',fontWeight:'bold',marginTop:4 }} text={'¥'} />
                <CustomText style={{ color: Theme.theme, fontSize: 20}} text={totalPrice} />
                {
                    isShowServiceCharge ?
                        <CustomText style={{ color: 'gray', fontSize: 12 }} text='(含服务费)' />
                        : null
                }
                <View style={{ flex: 1, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center',marginRight:20,marginTop:10,marginBottom:10 }}>
                    <TouchableHighlight underlayColor='transparent' onPress={this._showPriceDetail} >
                        <View style={{ flexDirection: "row", flex: 1, justifyContent: "flex-end", alignItems: "center", height: 30 }}>
                            <CustomText style={{ fontSize: 12, color: 'gray' }} text='明细' />
                            <Ionicons name={showPriceDetail ? 'chevron-up' : 'chevron-down'} size={16} color={'gray'} style={{ marginRight: 5,marginLeft:2 }} />
                        </View>
                    </TouchableHighlight>
                    <Touchable onPressWithSecond={3000}
                        onPress={()=>{
                            compSwitch?
                            this._compOrderClick()
                            : this._orderBtnClick()
                        }}
                    >
                        <View style={styles.bottom_btn}>
                            <CustomText style={{ color: '#fff',fontSize:16 }} text='生成订单' />
                        </View>
                    </Touchable>
                </View>
            </View >
        )
    }
    _compOrderClick = () => {
        //检查出差人
        const { requestModel, Travellers, goFlightData,backFlightData } = this.params
        const { comp_userInfo, comp_travelers, compMassOrderId } = this.props
        let DomesFlightsList = [];
        if (goFlightData) {
            goFlightData.RcReasonLst = requestModel.OrderAir&&requestModel.OrderAir.RcReasonLst
            goFlightData.RcReasonLst&&goFlightData.RcReasonLst.map((item)=>{
                if(item.RuleType==1){
                    item.LowestFlight = goFlightData.LowestFlight
                }
            })
            DomesFlightsList.push(goFlightData);
        }
        if(backFlightData){
            backFlightData.RcReasonLst = requestModel.OrderAirReturn&&requestModel.OrderAirReturn.RcReasonLst
            backFlightData.RcReasonLst&&backFlightData.RcReasonLst.map((item)=>{
                if(item.RuleType==1){
                    item.LowestFlight = backFlightData.LowestFlight
                }
            })
            DomesFlightsList.push(backFlightData);
        }
        this.setState({
            DomesticFlightsList: DomesFlightsList
        })
        let Reference_employeeId = (comp_userInfo&&comp_userInfo.ReferenceEmployeeId)?(comp_userInfo&&comp_userInfo.ReferenceEmployeeId):(comp_travelers&&comp_travelers.ReferenceEmployeeId)?comp_travelers.ReferenceEmployeeId:null
        let model = {
            MassOrderId: compMassOrderId,
            Category: 1,//国内机票
            ReferenceEmployeeId: Reference_employeeId,//差旅规则及审批规则的参照员工ID。如果没有综合订单ID，且有多个出差员工时这个字段必填！（出差员工+当前预订人中的任意一人）
            ProjectId: comp_userInfo && comp_userInfo.ProjectId,
            Travellers: Travellers && Travellers
        }
        this.showLoadingView();
        ComprehensiveService.MassOrderCheckTravellers(model).then(response => {
            this.hideLoadingView();
            if (response && response.success && response.data) {
                response.data.Travellers.map((item, index) => {
                    // item.Certificates = Travellers[index].Certificates
                    item.Certificate = requestModel.TravellerList[index].Certificate
                    if(requestModel?.TravellerList[index]?.Certificate?.Type == 1){
                        item.Certificate.NationalCode = 'CN'
                        item.Certificate.NationalName = '中国'
                        item.Nationality = 'CN'
                        item.Certificate.IssueNationCode = 'CN'
                        item.Certificate.IssueNationName = '中国'
                    }
                    item.CardTravellerList = requestModel.TravellerList[index].CardTravellerList
                    item.Mobile = requestModel.TravellerList[index].Mobile
                    item.Addition = requestModel.TravellerList[index].Addition
                })
                // this.push('CompDetailScreen',{data:response.data,comp_userInfo:comp_userInfo,goFlightData:goFlightData});
                // this.state.checkData.Travellers.OrderTravellerInsures = Travellers.Insurances
                this.setState({
                    checkData:response.data
                })
                this._reloadProjectList();
            } else {
                this.hideLoadingView();
                this.toastMsg(response.message);
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message);
        })
    }
    _reloadProjectList = () => {
        const { DomesticFlightsList, IgnoreConfirm,checkData } = this.state;
        const { comp_userInfo, compMassOrderId, comp_travelers, compCreate_bool,apply } = this.props
        const {goFlightData,userInfo,AttachmentModel,customerInfo,requestModel} = this.params;
        let addition = customerInfo&&customerInfo.Addition&&customerInfo.Addition
        if (!checkData&&checkData.Travellers) { return }
        checkData.Travellers.map((item,index)=>{
            item.OrderTravellerInsures = this.requestModel.TravellerList[index].Insurances
        })
        // let Reference_employeeId = (comp_userInfo&&comp_userInfo.ReferenceEmployeeId)?(comp_userInfo&&comp_userInfo.ReferenceEmployeeId):(comp_travelers&&comp_travelers.ReferenceEmployeeId)?comp_travelers.ReferenceEmployeeId:null
        let referencEmployeeId
        if(this.props.comp_userInfo&&this.props.comp_userInfo.employees&&this.props.comp_userInfo.employees.length>0){
            let num = this.props.comp_userInfo&&this.props.comp_userInfo.employees.length-1
            referencEmployeeId = this.props.comp_userInfo.employees[num]&&this.props.comp_userInfo.employees[num].PassengerOrigin&&this.props.comp_userInfo.employees[num].PassengerOrigin.EmployeeId
        }else{
            referencEmployeeId = userInfo.Id
        }
        let bookStr = Util.Parse.isChinese() ? '提交订单' : 'Confirm booking'
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
            MassOrderId: compMassOrderId, //compMassOrderId ,综合订单id，有就传值，没有就不传
            RulesTravelId: checkData.RulesTravelId,//差旅规则id
            Approval: compCreate_bool ? checkData.Approval : comp_travelers.Approval,
            ProjectId: comp_userInfo && comp_userInfo.ProjectId,//项目id
            Platform: Platform.OS,
            Travellers: checkData.Travellers,//出差人列表
            DomesticFlights: DomesticFlightsList,//国内机票航班列表
            IntlFlight: null,//国际机票行程信息
            Hotel: null,//国内酒店信息（包含房型）
            ForeignHotel: null,//港澳台及国际酒店信息（包含房型）
            Train: null,//火车票车次信息（包含坐席）
            // ReferenceEmployeeId: Reference_employeeId,
            IgnoreConfirm: this.state.IgnoreConfirm,
            AdditionInfo:this.requestModel.AdditionInfo,
            IsClearCardTraveller:false,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:referencEmployeeId,
            ApplyId:apply&&apply.Id,
            Attachment:AttachmentModel,
            JourneyId:journeyid,
            ElectronicItineraryInfo:requestModel.ElectronicItineraryInfo
        }
        this.tipView.show();
        ComprehensiveService.MassOrderCreate(model).then(response => {
            this.tipView.hide();
            if (response && response.success) {
                if (response.code == 201 && response.data) {
                    //清空申请单
                    if(apply){
                        this.props.setApply();
                    }
                    this.push('FlightPayment', { SerialNumber: response.data.payment.SerialNumber });
                } else {
                    let showContinuAlert = false
                    if(addition.HasHotelAuth){
                        showContinuAlert = true
                    }else{
                        //清空申请单
                        if(apply){
                            this.props.setApply();
                        }
                        DeviceEventEmitter.emit('freshCompDetail', {orderId: response.data.Id, isStop:true});
                        this.push('CompDetailScreen', { orderId: response.data.Id, isStop:true });
                    }
                    this.setState({
                        isStop: true,
                        lastData:showContinuAlert?response.data:false
                    })
                }
            } else {
                if (response.code == 5) {
                    this.showAlertView(response.message, () => {
                        return ViewUtil.getAlertButton('取消', () => {
                            this.state.IgnoreConfirm = 0
                            this.dismissAlertView();
                            this.pop();
                        }, '确定', () => {
                            this.state.IgnoreConfirm = 1
                            this.dismissAlertView();
                            this._reloadProjectList();
                        })
                    })
                } else if (response.code == 4) {
                    // let str = I18nUtil.translate('Vip服务费') + response.data.VipServiceCharge + ',' + I18nUtil.translate('服务费') + response.data.ServiceCharge + I18nUtil.translate('您确定继续预订吗？');
                    // let str = I18nUtil.translate('服务费') + this._serviseFee() + I18nUtil.translate('您确定继续预订吗？');
                    // this.showAlertView(str, () => {
                    //     return ViewUtil.getAlertButton('取消', () => {
                    //         this.dismissAlertView();
                    //         this.pop();
                    //     }, '确定', () => {
                            this.requestModel.ServiceCharge = response.data.ServiceCharge;
                            this.requestModel.VipServiceCharge = response.data.VipServiceCharge;
                            this.dismissAlertView();
                            this._compOrderClick();
                    //     })
                    // })
                } else if (response.code == 8) {
                    this.showAlertView(response.message, () => {
                        return ViewUtil.getAlertButton('返回重新预订', () => {
                            this.dismissAlertView();
                            NavigationUtils.popToTop(this.props.navigation);
                        }, '继续预订', () => {
                            this.dismissAlertView();
                            if (response.data && response.data.length > 0) {
                                response.data.forEach(item => {
                                    if (item.Departure === this.requestModel.OrderAir.Departure && item.Destination === this.requestModel.OrderAir.Destination) {
                                        this.requestModel.OrderAir = item;
                                    }
                                    if (this.requestModel.OrderAirReturn) {
                                        if (item.Departure === this.requestModel.OrderAirReturn.Departure && item.Destination === this.requestModel.OrderAirReturn.Destination) {
                                            this.requestModel.OrderAirReturn = item;
                                        }
                                    }
                                })
                            }
                            this._compOrderClick();
                        })
                    })
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
            this.tipView.hide();
            this.requestModel.IgnoreConfirm = 0;
            this.toastMsg(error.message || '提交订单失败出错,请重试!');
        })
    }
    _hotelAlert(data, flightDate, ArrivalCityName) {
        const { userInfo, customerInfo } = this.params;
        if (!userInfo || !customerInfo) { return }
        let hotelbool = true
        let hotelPoor = true
        customerInfo.SettingItems.map((item) => {
            if (item.Code == 'customer_book_hotel') {
                hotelPoor = item.Value
            }
        })
        userInfo.RulesTravel && userInfo.RulesTravel.RuleTravelDetails.map((item) => {
            if (item.OrderCategory == 4 && item.RuleType == 6) {
                hotelbool = false
            }
        })
        let letter = `飞机预订成功是否继续预订${flightDate && flightDate.substr(0, 10)}${ArrivalCityName}的酒店`
        if (flightDate && hotelbool && hotelPoor) {
            this.showAlertView(letter, () => {
                return ViewUtil.getAlertButton('暂不预订', () => {
                    DeviceEventEmitter.emit('freshCompDetail', {orderId: data.Id, isStop:true});
                    this.push('CompDetailScreen', { orderId: data.Id, isStop:true });
                    this.dismissAlertView();
                }, '预订', () => {
                    this.dismissAlertView();
                    this._orderContinu(data);
                })
            })
        }
    }

    _comp_continueAlert=()=>{
        const {lastData} = this.state;
        const {goFlightData} = this.params;
        if(!lastData){return}
        let bookStr = Util.Parse.isChinese() ? '提交订单' : 'Confirm booking'
        return(
           <View style={{position:'absolute',top:-94, height:global.screenHeight, width:global.screenWidth}}>
             <View style={styles.container2}>
             <View style={styles.alertStyle}>
                 <TouchableOpacity  onPress={()=>{}}
                       style={{width:'100%',flexDirection:'row-reverse'}}>
                    
                 </TouchableOpacity>
                 <View style={{width:'100%',justifyContent:'center',alignItems:'center'}}>
                     <CustomText text={'订单尚未完成，请选择继续添加其他行程或点击提交订单进入下一步。'} style={{padding:6,fontSize:17,fontWeight:'bold'}}/>
                 </View>
                 <TouchableOpacity 
                           style={{height:40,alignItems:'center',justifyContent:'center',marginTop:10,borderTopWidth:1,borderColor:Theme.lineColor}}
                           onPress={()=>{
                            this.dismissAlertView();
                                let customerInfo = this.props.customerInfo_userInfo?.customerInfo;
                                if (customerInfo?.Addition?.HasHotelAuth) {
                                    if (lastData) {
                                        this._orderContinu(lastData, goFlightData);
                                    }
                                } else {
                                    this.toastMsg('暂未开通酒店预订功能');
                                }
                           }}>
                           <CustomText  text='添加酒店行程' style={{fontSize:18,color:Theme.theme}}/>
                 </TouchableOpacity>
                 <TouchableOpacity 
                           style={{height:40,alignItems:'center',justifyContent:'center',borderTopWidth:1,borderColor:Theme.lineColor}}
                           onPress={()=>{
                               DeviceEventEmitter.emit('freshCompDetail', {orderId: lastData.Id, isStop:true});
                               this.push('CompDetailScreen', { orderId: lastData.Id, isStop:true });
                           }}
                           >
                           <CustomText  text={bookStr} style={{fontSize:18,color:Theme.theme}}/>
                 </TouchableOpacity>
                 </View>
             </View>
         </View>
        )
   }

    _orderContinu = (data, goFlightData) => {
        const { setComp_travellers, setComp_Id, onClickSure, compMassOrderId, comp_travelers,apply,} = this.props;
        const { customerInfo } = this.params;
        const { BeginTime,EndTime,goCityDisplay,arrivalCityDisplay ,DomesticFlightsList} = this.state;
        let cityList = [goCityDisplay,arrivalCityDisplay];
        let compEmployees = []
        let compTraveler = []
        data.Travellers.map((item) => {
            if (item.PassengerOrigin.Type === 1) {
                compEmployees.push(item);
            } else {
                compTraveler.push(item);
            }
        })
        setComp_travellers(compEmployees, compTraveler, data);
        setComp_Id(data.Id)
        onClickSure(false)//点击继续预订时将判断是否是创建订单的值改为否
        let bCategory;
        if(apply&&apply.SerialNumber && ( apply.BusinessCategory&4 )){
            this.push('ApplicationSelect',{
                from:'hotel',
                andFrom:'compDetail', 
                // applySerialNumber:apply&&apply.SerialNumber,
                customerInfo:customerInfo,
                SerialNumber:apply&&apply.SerialNumber,
                cityList:cityList,
                compMassId:data.Id,
            });

        }else{
            // cityList = null;
            bCategory=true
            this.props.setApply();
            DeviceEventEmitter.emit('HotelSearchLs', { //跳转页面监听
                isIntl: false,
                flight: {
                    Destination: goFlightData ? goFlightData.ArrivalCityName : '',
                    DestinationTime: goFlightData ? Util.Date.toDate(goFlightData.ArrivalTime) : new Date()
                },
                BeginTime:BeginTime?BeginTime:DomesticFlightsList[0].ArrivalTime,
                EndTime,
                bCategory,
                cityList,
                arrivalCityDisplay:arrivalCityDisplay,
            });
            this.push('HotelSearchIndex', {
                isIntl: false,
                flight: {
                    Destination: goFlightData ? goFlightData.ArrivalCityName : '',
                    DestinationTime: goFlightData ? Util.Date.toDate(goFlightData.ArrivalTime) : new Date()
                },
                BeginTime:BeginTime?BeginTime:DomesticFlightsList[0].ArrivalTime,
                EndTime,
                bCategory,
                cityList,
                arrivalCityDisplay:arrivalCityDisplay,
                // applySerialNumber:apply&&apply.SerialNumber
            });
        }
        
    }

    //分开写 写两个 _commonCity
    _commonCity1 = (item) =>{
        let model = {
            Keyword: item,
            Domestic:''
        }
        CommonService.CommonCity(model).then(response => {
            if (response && response.success) {
                if (response.data && response.data) {
                    response.data.map((obj)=>{
                        if(obj.Name == item.replace('市','') ){
                           this.setState({
                            goCityDisplay:obj
                           })
                        }
                    })
                }
            } else {
                this.toastMsg(response.message || '获取数据失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }
    _commonCity2 = (item) =>{
        let model = {
            Keyword: item,
            Domestic:''
        }
        CommonService.CommonCity(model).then(response => {
            if (response && response.success) {
                if (response.data && response.data) {
                    response.data.map((obj)=>{
                        if(obj.Name == item.replace('市','') ){
                            this.setState({
                                arrivalCityDisplay:obj
                            })
                        }
                    })
                }
            } else {
                this.toastMsg(response.message || '获取数据失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }

    renderBody() {
        const { goFlightData, goRuleModel, backFlightData, backRuleModel, AdditionInfo, customerInfo, requestModel, ApproveList,moreTravel } = this.params;
        const { TermsAgreement,lastData,isStop,showContinuAlert } = this.state;
        const { comp_userInfo,compSwitch } = this.props;
        return (
            <LinearGradient start={{x: 1, y: 0}} end={{x: 1, y: 0.5}} style={{flex:1}} colors={[Theme.theme,Theme.normalBg]}>
                <ScrollView keyboardShouldPersistTaps='handled'>
                    <View style={styles.headerView}>
                        <HeaderView
                            headerTextTile={moreTravel?'第一程':'去'}
                            model={goFlightData}
                            ruleModel={goRuleModel}
                            otwThis={this}
                            feeType={this.props.feeType}
                        />
                        <HeaderView
                            headerTextTile={moreTravel?'第二程':'返'}
                            model={backFlightData}
                            otwThis={this}
                            ruleModel={backRuleModel}
                            feeType={this.props.feeType}
                        />
                    </View>
                    <PassengerSureView feeType={this.props.feeType} PassengerList={requestModel && requestModel.TravellerList} ApproveList={ApproveList} customerInfo={customerInfo} from={'flight'} />
                    {
                        !compSwitch?
                        <View style={{marginHorizontal:10,backgroundColor:'#fff',paddingHorizontal:20,paddingVertical:10,borderRadius:6,marginTop:10}}>
                        <CustomText style={{width:'30%'}} text={'联系人'}></CustomText>
                        <View style={{flexDirection:'row',marginTop:10}}>
                            <CustomText style={{width:'30%'}} text={'联系电话'}></CustomText>
                            <CustomText style={{width:'70%',color:Theme.commonFontColor}} text={requestModel.Contact?.Mobile}></CustomText>
                        </View>
                        <View style={{flexDirection:'row',marginTop:10}}>
                            <CustomText style={{width:'30%'}} text={'Email'}></CustomText>
                            <CustomText style={{width:'70%',color:Theme.commonFontColor}} text={requestModel.Contact?.Email}></CustomText>
                        </View>
                        </View>:null
                    }
                    <OrderSureBottom AdditionInfo={AdditionInfo} customerInfo={customerInfo} TermsAgreement={TermsAgreement} from={'flight'} />
                </ScrollView>
                {this._renderBottomView()}
                <PriceDetailView ref={o => this.priceDetailView = o} {...this.state} {...this.params}  {...comp_userInfo} merchantPrice={this.params.merchantPrice}  callBack={()=>{
                     this._showPriceDetail();
                }}/>
                <RuleView ref={o => this.ruleView = o} />
                <RuleView2 ref={o => this.ruleView2 = o} />
                <SumbitOrderTipView ref={o => this.tipView = o} goTrip={goFlightData} arrivalTrip={backFlightData} TravellerList={requestModel && requestModel.TravellerList} />
                {lastData?this._comp_continueAlert():null}
                {/* {showContinuAlert?this._continueAlert():null} */}
            </LinearGradient>
        )
    }
}
const getStateProps = state => ({
    feeType: state.feeType.feeType,
    comp_userInfo: state.comp_userInfo,
    compSwitch: state.compSwitch.bool,
    customerInfo_userInfo: state.customerInfo_userInfo,
    comp_travelers: state.comp_travelers.travellers,
    compMassOrderId: state.compMassOrderId.massOrderId,
    compCreate_bool: state.compCreate_bool.bool,
    apply: state.apply.apply,
})
const getActions = dispatch => ({
    setComp_travellers: (compEmployees, compTraveler, travellers) => dispatch(Action.setComp_travellers(compEmployees, compTraveler, travellers)),
    setComp_Id: (value) => dispatch(Action.setComp_Id(value)),
    onClickSure: (compCreateBool) => dispatch(Action.onClickSure(compCreateBool)),
    setApply: (value) => dispatch(Action.applySet(value)),
})

export default connect(getStateProps, getActions)(FlightOrderSureScreen);
const styles = StyleSheet.create({
    titleText: {
        fontSize: 18,
        color: 'white'
    },
    headerView: {
        // backgroundColor: Theme.theme,
        paddingHorizontal: 10
    },
    bottom_btn: {
        width: 100,
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Theme.theme,
        borderRadius:2
    },
    container2:{
        flex:1,
        backgroundColor:'rgba(0, 0, 0, 0.3)',
        justifyContent:'center',
        alignItems:'center'
      },
    alertStyle:{
        width: '80%', 
        backgroundColor:'#fff',
        borderRadius:8,
        padding:10,
    }
    
})
