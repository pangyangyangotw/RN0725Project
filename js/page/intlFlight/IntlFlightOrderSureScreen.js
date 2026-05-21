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
import OrderSureBottom from '../common/OrderSureBottom';
import PassengerSureView from '../common/PassengerSureView';
import { connect } from 'react-redux';
import FlightService from '../../service/FlightService';
import Util from '../../util/Util';
import ViewUtil from '../../util/ViewUtil';
import NavigationUtils from '../../navigator/NavigationUtils';
import I18nUtil from '../../util/I18nUtil';
import BackPress from '../../common/BackPress';
import PolicyView from './PolicyView';
import PolicyView2 from './PolicyView2';
import InflFlightService from '../../service/InflFlightService';
import ComprehensiveService from '../../service/ComprehensiveService';
import Touchable from '../../util/TouchableUtil';
import CommonService from '../../service/CommonService';
import Action from '../../redux/action/index';
import  LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';


class IntlFlightOrderSureScreen extends SuperView {
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
            TermsAgreement:null,
            IgnoreConfirm:false,
            showContinuAlert:false,
            lastData:{},
            ArrivalCity:'',
            compMassId:null
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
        }else if(this.state.showContinuAlert && this.state.compMassId){
            DeviceEventEmitter.emit('freshCompDetail', {orderId:this.state.compMassId, isStop:true});
            this.push('CompDetailScreen', { orderId:this.state.compMassId, isStop:true });
        }
        return true;
    }

    componentDidMount() {
        const { journey } = this.params;
        let lineArr = [journey.TicketingCarrier];
        let model = {
            AirlineCodes:lineArr,
            NationalType:2 //国际
        }
        this.showLoadingView()
        InflFlightService.CommonAirline(model).then(response => {
            this.hideLoadingView()  
            if (response && response.success && response.data) {
                   this.setState({
                       TermsAgreement:response.data?.[0]?.TermsAgreement
                })
           }else{
            this.toastMsg(response.message);
           }
        }).catch(error => {
            this.hideLoadingView()
            this.toastMsg(error.message || '加载数据失败请重试');
        })

        this._commonCity1()
        
        this.backPress.componentDidMount();
    }

    _commonCity1 = () =>{
        const {cityList} = this.params
        let model = {
            Keyword: this.params.order.Destination,
            Domestic:''
        }
        CommonService.CommonCity(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if (response.data && response.data) {
                    response.data.map((obj)=>{
                        if(obj.Name == this.params.order.Destination.replace('市','') ){
                           this.setState({
                            ArrivalCity:obj
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

    _orderBtnClick = () => {
        this.showLoadingView();
         InflFlightService.createOrder(this.requestModel).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if (response.code == 201 && response.data) {
                    this.push('IntlFlightPayment', { SerialNumber: response.data.PaymentSn });
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
                                this.push('IntlFlightOrderList');
                                this.dismissAlertView();
                            })
                        })
                    })
                }
            } else {
                if (response.code == 5) {
                    let str = Util.Parse.isChinese()?'继续预订':'Confirm'
                    this.showAlertView(response.message, () => {
                        return ViewUtil.getAlertButton('取消', () => {
                            this.dismissAlertView();
                            NavigationUtils.popToTop(this.props.navigation);
                        }, str, () => {
                            this.requestModel.IgnoreConfirm = true
                            this._orderBtnClick()
                            this.dismissAlertView();
                        })
                    },'重复预订提醒')
                }else{
                    this.showAlertView(response.message || '提交订单失败出错,请重试!', () => {
                        return ViewUtil.getAlertButton('确定', () => {
                            this.dismissAlertView();
                            this.pop();
                        })
                    })
                }
            }
        }).catch(error => {
            // console.log(error.message);
            this.hideLoadingView();
            this.toastMsg(error.message || '提交订单失败出错,请重试!');
        })
    }
    //综合订单生成订单
    _compOrderBtnClick=(IgnoreConfirm)=>{    
        const { comp_checkTravellers, comp_userInfo,comp_travelers,compCreate_bool } = this.props
        if(compCreate_bool){
            comp_checkTravellers.Travellers.map((item,index)=>{
                item.Certificate = this.requestModel.PassengerList[index].Certificate;
                item.Surname = this.requestModel.PassengerList[index].Surname,
                item.GivenName = this.requestModel.PassengerList[index].GivenName
                item.Birthday = this.requestModel.PassengerList[index].Birthday
                item.Addition = this.requestModel.PassengerList[index].Addition
                item.Addition = this.requestModel.PassengerList[index].Addition,
                item.CardTraveller = this.requestModel.PassengerList[index].CardTraveller
             })
            // this.push('CompDetailScreen',{data:comp_checkTravellers,comp_userInfo:comp_userInfo,intlFlightModel:this.params.journey});
            this._reloadProjectList(comp_checkTravellers,IgnoreConfirm);
        }
        else{
            comp_travelers.travellers.Travellers.map((item,index)=>{
                item.Certificate = this.requestModel.PassengerList[index].Certificate;
                item.Surname = this.requestModel.PassengerList[index].Surname,
                item.GivenName =this.requestModel.PassengerList[index].GivenName,
                item.Birthday =this.requestModel.PassengerList[index].Birthday,
                item.Addition = this.requestModel.PassengerList[index].Addition,
                item.CardTraveller = this.requestModel.PassengerList[index].CardTraveller
            })
            // this.push('CompDetailScreen',{data:comp_travelers.travellers,comp_userInfo:comp_userInfo,intlFlightModel:this.params.journey});
            this._reloadProjectList(comp_travelers.travellers,IgnoreConfirm);
        }
    }
    _getLowFlight=(flightSegment)=>{
        var tax = 0;
        var price =0;
        var TPM =0;
        var basePrice =0;
        var agentFee =0;
        flightSegment&&flightSegment.PriceList&&flightSegment.PriceList.forEach(element => {
          if(element.PassengerType == 'ADT'){
            tax+=element.Tax;
            price+=element.BasePrice;
            basePrice+=element.BasePrice;
            agentFee+=element.AgentFee;
          }
        });
        flightSegment&&flightSegment.Journeys&&flightSegment.Journeys.forEach(element => {
            element&&element.FlightSegments.forEach(seg => {
            TPM+=seg.TPM;
          });
          
        });
        return  {
          Tax: tax,
          Tpm: TPM,
          Price:price,
          Stop: 0,
          SeqNo: 0,
          Airline: flightSegment.Journeys[0].FlightSegments[0].Airline,
          BatchId: 0,
          OrderId: 0,
          AirPlace: flightSegment.Journeys[0].FlightSegments[0].CabinCode,
          PubPrice: basePrice,
          AgencyFee: agentFee,
          AirNumber: flightSegment.Journeys[0].FlightSegments[0].FlightNumber,
          Departure: flightSegment.Journeys[0].FlightSegments[0].DepartureCityName,
           FareBasis: '',
          PlaceState: '',
          AirlineName: flightSegment.Journeys[0].FlightSegments[0].AirlineName,
          Destination: flightSegment.Journeys[0].FlightSegments[0].ArrivalCityName,
          ShareAirNumber: '',
           DepartureTime: flightSegment.Journeys[0].FlightSegments[0].DepartureTime,
           DestinationTime: flightSegment.Journeys[0].FlightSegments[0].ArrivalTime,
           ShareAirlineName: '',
          DepartureAirport: flightSegment.Journeys[0].FlightSegments[0].DepartureAirport,
          DestinationAirport: flightSegment.Journeys[0].FlightSegments[0].ArrivalAirport,
          DepartureAirportName: flightSegment.Journeys[0].FlightSegments[0].DepartureAirportName,
          DestinationAirportName: flightSegment.Journeys[0].FlightSegments[0].ArrivalAirportName,
          DepartureAirportTerminal: flightSegment.Journeys[0].FlightSegments[0].DepartureTerminal,
          DestinationAirportTerminal: flightSegment.Journeys[0].FlightSegments[0].ArrivalTerminal
        };
  
      }
    _reloadProjectList = (data,IgnoreConfirm) => {
        const { comp_checkTravellers, comp_userInfo,comp_travelers,compMassOrderId,apply } = this.props
        const { hotelModel,trainData,IntlHotelModel ,passengerList,journey,AttachmentModel,customerInfo} = this.params
        const { ArrivalCity } = this.state
        let Reference_employeeId = (comp_userInfo&&comp_userInfo.ReferenceEmployeeId)?(comp_userInfo&&comp_userInfo.ReferenceEmployeeId):(comp_travelers&&comp_travelers.travellers&&comp_travelers.travellers.ReferenceEmployeeId)?comp_travelers.travellers.ReferenceEmployeeId:null
        let LowestFlight0 ;
        let addition = customerInfo&&customerInfo.Addition&&customerInfo.Addition
        if(journey.RcReasonLst&&journey.RcReasonLst.length>0){
            // LowestFlight0 = this._getLowFlight(journey.RcReasonLst[0].LowestFlight)
            journey.RcReasonLst.map((item)=>{
                if(item.RuleType===1){
                    LowestFlight0 = this._getLowFlight(journey)
                    journey.RcReasonLst[0].LowestFlight = LowestFlight0
                }
            })
        }
        let journeyType = 1;
        let journeyid = 0;
        if(apply){
            if(apply.TravelApplyMode==1 && apply.JourneyList && apply.JourneyList.length>0){
                //行程模式
                if(apply.selectApplyItem){
                    journeyType = apply.selectApplyItem&&apply.selectApplyItem.JourneyType;
                    journeyid = apply.selectApplyItem&&apply.selectApplyItem.Id
                }else{
                    apply.JourneyList.forEach((item,index)=>{
                        if(item?.BusinessCategory & 8){
                           journeyType = item.JourneyType;
                           journeyid = item.Id
                        }
                   })
                }
            }else{
                //目的地模式
                journeyType = apply?.JourneyType;
                journeyid = apply?.Id
            }
        }
        if(!data){return}
        let model = {
            MassOrderId:compMassOrderId, //compMassOrderId ,综合订单id，有就传值，没有就不传
            RulesTravelId:2,//差旅规则id
            Approval:data.Approval,
            ProjectId: comp_userInfo&&comp_userInfo.ProjectId,//项目id
            Platform: Platform.OS,
            Travellers: data.Travellers,//出差人列表
            DomesticFlights:[],//国内机票航班列表
            IntlFlight:journey,//国际机票行程信息
            Hotel: null,//国内酒店信息（包含房型）
            ForeignHotel: null,//港澳台及国际酒店信息（包含房型）
            Train: null,//火车票车次信息（包含坐席）
            ReferenceEmployeeId:Reference_employeeId,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
            AdditionInfo:this.requestModel.AdditionInfo,
            IsClearCardTraveller:false,
            ApplyId:apply&&apply.Id,
            Attachment:AttachmentModel,
            IgnoreConfirm:IgnoreConfirm?true:false,
            JourneyId:journeyid
        }
        this.showLoadingView()
        let str = Util.Parse.isChinese()?'继续预订':'Confirm'
        ComprehensiveService.MassOrderCreate(model).then(response => {
            this.hideLoadingView()  
            if (response && response.success && response.data) {
                let showContinuAlert = false
                if((ArrivalCity&&ArrivalCity.NationalCode === 'CN' && addition.HasHotelAuth) || (ArrivalCity&&ArrivalCity.NationalCode != 'CN' && addition.HasInterHotelAuth)){
                    showContinuAlert = true
                }else{
                    if(apply){
                        this.props.setApply();
                    }
                    DeviceEventEmitter.emit('freshCompDetail', {orderId:response.data.Id, isStop:true});
                    this.push('CompDetailScreen',{orderId:response.data.Id, isStop:true});
                }
                this.setState({
                    isStop: true,
                    showContinuAlert:showContinuAlert,
                    compMassId:response.data.Id,
                    lastData:response.data
                })
            }else{
                if (response.code == 5) {
                    this.showAlertView(response.message, () => {
                        return ViewUtil.getAlertButton('取消', () => {
                            this.dismissAlertView();
                            NavigationUtils.popToTop(this.props.navigation);
                        }, str, () => {
                            // model.IgnoreConfirm = true
                            this._compOrderBtnClick(true)
                            this.dismissAlertView();
                        })
                    },'重复预订提醒')
                }else{
                    this.toastMsg(response.message);
                }
           }
        }).catch(error => {
            this.hideLoadingView()
            this._detailLoadFail();
            this.toastMsg(error.message || '加载数据失败请重试');
        })
    }
    /**
     *  显示退改规则
     */
    _showRules = (index) => {
        if(index===1){
            this.policyView.show(this.state.order);
        }else{
            this.policyView2.show(this.state.order);
        }
    }

    _renderBottomView = () => {
        const { showPriceDetail } = this.state;
        const { customerInfo, totalPrice,ServiceFeesData } = this.params;
        const {compSwitch} = this.props;
        let isShowServiceCharge =   ServiceFeesData && ServiceFeesData.IsShowServiceFee;
        return (
            <View style={{ height: 50, flexDirection: 'row', backgroundColor: 'white', alignItems: 'center' }}>
                <CustomText style={{ marginLeft: 10, color: Theme.theme, fontSize: 15 }} text={'¥' + totalPrice} />
                {
                    isShowServiceCharge ?
                        <CustomText style={{ color: 'gray', fontSize: 12 }} text='(含服务费)' />
                    : null
                }
                <View style={{ flex: 1, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center' }}>
                    <Touchable onPressWithSecond={3000}
                        onPress={()=>{
                            compSwitch?this._compOrderBtnClick():this._orderBtnClick()
                        }}
                    >
                        <View style={styles.bottom_btn}>
                            <CustomText style={{ color: 'white' }} text='生成订单' />
                        </View>
                    </Touchable>
                </View>
            </View >
        )
    }
    renderBody() {
        const { order, AdditionInfo, customerInfo, requestModel, ApproveList,goRuleModel,backRuleModel } = this.params;
        const { TermsAgreement,showContinuAlert } = this.state
        const { compSwitch } = this.props;
        let ContainsNoChange = this.params.journey.ModifyPolicy&&this.params.journey.ModifyPolicy[0]&&this.params.journey.ModifyPolicy[0].ContainsNoChange
        let ContainsNoRefund = this.params.journey.ModifyPolicy&&this.params.journey.ModifyPolicy[0]&&this.params.journey.ModifyPolicy[0].ContainsNoRefund
        let ContainsNoChange_r = this.params.journey.ModifyPolicy&&this.params.journey.ModifyPolicy[1]&&this.params.journey.ModifyPolicy[1].ContainsNoChange
        let ContainsNoRefund_r = this.params.journey.ModifyPolicy&&this.params.journey.ModifyPolicy[1]&&this.params.journey.ModifyPolicy[1].ContainsNoRefund
        return (
            <LinearGradient start={{x: 1, y: 0}} end={{x: 1, y: 0.5}} style={{flex:1}} colors={[Theme.theme,Theme.normalBg]}>
                <ScrollView keyboardShouldPersistTaps='handled' showsVerticalScrollIndicator={false}>
                    <HeaderView 
                      order={order} showRules={(index)=>this._showRules(index)} 
                      goRuleModel={goRuleModel} 
                      backRuleModel={backRuleModel} 
                      otwThis={this} 
                      ContainsNoChange={ContainsNoChange}
                      ContainsNoRefund={ContainsNoRefund}
                      ContainsNoChange_r={ContainsNoChange_r}
                      ContainsNoRefund_r={ContainsNoRefund_r}
                    />
                    <PassengerSureView feeType={this.props.feeType} PassengerList={requestModel && requestModel.PassengerList} ApproveList={ApproveList} customerInfo={customerInfo} from={'intlFlight'} fromNo={32}/>
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
                    <OrderSureBottom AdditionInfo={AdditionInfo} TermsAgreement={TermsAgreement} customerInfo={customerInfo} from={'intlFlight'} />
                </ScrollView>
                {this._renderBottomView()}
                {showContinuAlert?this._continueAlert():null}
                <PolicyView order={order} ref={o => this.policyView = o} type='createOrder'/>
                <PolicyView2 ref={o => this.policyView2 = o} order={order} type='createOrder' />
            </LinearGradient>
        )
    }

    _continueAlert=()=>{
        const {goCityDisplay,arrivalCityDisplay,BeginTime,EndTime,ArrivalCity,compMassId,lastData} = this.state;
        const { journey } = this.params
        const {apply,customerInfo,setComp_Id,setComp_travellers,onClickSure} = this.props;
        let cityList = [goCityDisplay,arrivalCityDisplay];
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
                                let OrderAir = this.requestModel.OrderAir;
                                let bCategory;
                                if(!(apply&&apply.BusinessCategory&4)){
                                    cityList = null;
                                    bCategory=true
                                }
                                let compEmployees = []
                                let compTraveler = []
                                lastData.Travellers.map((item) => {
                                    if (item.PassengerOrigin.Type === 1) {
                                        compEmployees.push(item);
                                    } else {
                                        compTraveler.push(item);
                                    }
                                })
                                setComp_travellers(compEmployees, compTraveler, lastData);
                                setComp_Id(compMassId)
                                onClickSure(false)//点击继续预订时将判断是否是创建订单的值改为否
                                if(apply&&apply.SerialNumber&& ( apply.BusinessCategory&6 )){
                                    if(ArrivalCity.NationalCode === 'CN'){
                                        this.push('ApplicationSelect',{
                                            from:'hotel',
                                            andFrom:'compDetail', 
                                            // applySerialNumber:apply&&apply.SerialNumber,
                                            customerInfo:customerInfo,
                                            SerialNumber:apply&&apply.SerialNumber,
                                            cityList:cityList,
                                            compMassId:compMassId,
                                            BeginTime:journey&&journey.Journeys[0].FlightSegments[0].ArrivalTime,
                                        });
                                    
                                    }else{
                                        this.push('ApplicationSelect',{
                                            from:'intlHotel',
                                            SerialNumber:apply&&apply.SerialNumber,
                                            andFrom:'compDetail',
                                            customerInfo:customerInfo,
                                            cityList:cityList,
                                            compMassId:compMassId,
                                            BeginTime:journey&&journey.Journeys[0].FlightSegments[0].ArrivalTime,
                                        });
                                    }
                                }else{
                                    // journey.Journeys[0].FlightSegments.ArrivalTime
                                    this.props.setApply();
                                    if(ArrivalCity.NationalCode === 'CN'){
                                        DeviceEventEmitter.emit('HotelSearchLs', { //跳转页面监听
                                            isIntl: false,
                                            selectTap:4,
                                            noApply:true,
                                            arrivalCityDisplay:ArrivalCity,
                                            // bCategory,
                                            BeginTime:journey&&journey.Journeys[0].FlightSegments[0].ArrivalTime,
                                            // EndTime:EndTime
                                            flight:true,
                                        });
                                        this.push('HotelSearchIndex', { 
                                            isIntl: false,
                                            selectTap:4,
                                            noApply:true,
                                            arrivalCityDisplay:ArrivalCity,
                                            // bCategory,
                                            BeginTime:journey&&journey.Journeys[0].FlightSegments[0].ArrivalTime,
                                            // EndTime:EndTime
                                            flight:true,
                                        });
                                    }else{
                                        DeviceEventEmitter.emit('HotelSearchLs', { //
                                            isIntl: true,
                                            selectTap:6,
                                            noApply:true,
                                            arrivalCityDisplay:ArrivalCity,
                                            // bCategory,
                                            BeginTime:journey&&journey.Journeys[0].FlightSegments[0].ArrivalTime,
                                            // EndTime:EndTime
                                            flight:true,
                                        });
                                        this.push('HotelSearchIndex', { 
                                            isIntl: true,
                                            selectTap:6,
                                            noApply:true,
                                            arrivalCityDisplay:ArrivalCity,
                                            // bCategory,
                                            BeginTime:journey&&journey.Journeys[0].FlightSegments[0].ArrivalTime,
                                            // EndTime:EndTime
                                            flight:true,
                                        });
        
                                    }
                                }
                           }}>
                           <CustomText  text='添加酒店行程' style={{fontSize:18,color:Theme.theme}}/>
                 </TouchableOpacity>
                 <TouchableOpacity 
                           style={{height:40,alignItems:'center',justifyContent:'center',borderTopWidth:1,borderColor:Theme.lineColor}}
                           onPress={()=>{
                                DeviceEventEmitter.emit('freshCompDetail', {orderId:compMassId, isStop:true});
                                this.push('CompDetailScreen',{
                                    orderId:compMassId,
                                    isStop:true
                                });
                           }}
                           >
                           <CustomText  text={bookStr} style={{fontSize:18,color:Theme.theme}}/>
                 </TouchableOpacity>
                 </View>
             </View>
         </View>
        )
   }
}
const getStateProps = state => ({
    feeType: state.feeType.feeType,
    compSwitch: state.compSwitch.bool,
    comp_checkTravellers: state.comp_checkTravellers.travellers,
    comp_userInfo:state.comp_userInfo,
    comp_travelers: state.comp_travelers,
    compMassOrderId: state.compMassOrderId.massOrderId,
    compCreate_bool: state.compCreate_bool.bool,
    apply: state.apply.apply,
})

const getActions = dispatch => ({
    setComp_Id: (value) => dispatch(Action.setComp_Id(value)),
    setApply: (value) => dispatch(Action.applySet(value)),
    setComp_travellers: (compEmployees, compTraveler, travellers) => dispatch(Action.setComp_travellers(compEmployees, compTraveler, travellers)),
    onClickSure: (compCreateBool) => dispatch(Action.onClickSure(compCreateBool)),    
})

export default connect(getStateProps,getActions)(IntlFlightOrderSureScreen);
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
