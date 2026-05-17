import React from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableHighlight,
    TouchableOpacity,
    Image
} from 'react-native';
import SuperView from '../../super/SuperView';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Util from '../../util/Util';
import TrainEnum from '../../enum/TrainEnum';
import I18nUtil from '../../util/I18nUtil';
import UserInfoDao from '../../service/UserInfoDao';
import { connect } from 'react-redux';
import ViewUtil from '../../util/ViewUtil';
import HTMLView from 'react-native-htmlview';
import TrainlistView from './TrainlistView';
import Feather from 'react-native-vector-icons/Feather';
import CommonService from '../../service/CommonService';
import Pop from 'rn-global-modal';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

class TrainTicketDetailScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '选择席位',
        }
        this.state = {
            customerInfo:'',
            isOnlyApply:false,//是否必须通过申请单预订
            alertShow:false,
            itemData:null,
        }
    }
    componentDidMount(){
        const{ customerInfo_userInfo,apply,compSwitch } = this.props;
        let model = {
            ReferenceEmployeeId: this.props.comp_userInfo?.ReferenceEmployeeId || 0,
            ReferencePassengerId: this.props.comp_userInfo?.referencPassengerId || null,
        };
        CommonService.customerInfo(model).then(response => {
            if (response?.success && response.data) {
                const isApply = response.data?.Setting?.FlightTravelApplyConfig;
                if (isApply && isApply.IsAllCategory && isApply.IsOnlyApply && !customerInfo_userInfo?.userInfo?.NoNeedApply && !apply) {
                    this.setState({ 
                        isOnlyApply: true,
                        customerInfo:response.data,
                    });
                }
            }
        });
    }
    /**
     *  展示经停数据
     */
    _trainStopStations = () => {
        this.params.ticket.departureDate = this.params.departureDate.format('yyyy-MM-dd', true);
        this.push('TrainStopStation', this.params.ticket);
    }
    /**
     *  展示预订须知
     */
    _alertNotice = () => {
        // this.showAlertView(Util.Parse.isChinese() ? TrainEnum.trainOrderNotice.cn : TrainEnum.trainOrderNotice.en);
        const { ticket } = this.params;
        let _alertA = Util.Parse.isChinese() ? TrainEnum.trainOrderNotice.cn : TrainEnum.trainOrderNotice.en
        let _alertB = Util.Parse.isChinese() ? TrainEnum.trainOrderNoticeGSG.cn : TrainEnum.trainOrderNoticeGSG.en
        this.showAlertView( (ticket.from_station_code==="XJA" || ticket.to_station_code==="XJA") ? _alertB : _alertA );
    }
    /**
     *  预订
     */
    _trainReserve = (item) => {
        if (this.props.highRisk) {
             if(this.props.highRisk.Level == 1){
                this.setState({
                    alertShow:true,
                    itemData:item,
                })
             }else{
                 this.toastMsg('高危区域，不能预订');
             }
          
        } else{
            this._toNextOrder(item);
        }
    }

    _toNextOrder = (item)=>{
        const { ticket, reissueOrder, departureDate, feeType, recommendTrain} = this.params;
        const { compSwitch } = this.props;
        // if (item && item.seatCount > 0) {
            if (ticket.ViolationMode === 1 && item.checkSeat===0) {
                this.toastMsg('超标禁止预订');
                return;
            }
            let seat = item.seatCount;//剩余座位数
            // if (reissueOrder) {
            //     let oldDep = Util.Date.toDate(reissueOrder.TrainInfo.DepartureTime);
            //     let twoLaterDate = new Date().addDays(2);
            //     let oldArrivalStation = reissueOrder.TrainInfo.ToStationName;
            //     if (oldArrivalStation.slice(0, 2) === ticket.to_station_name.slice(0, 2)) {
            //         let oldLastTime = new Date(oldDep.getFullYear(), oldDep.getMonth(), oldDep.getDate(), '24', '00', '00');
            //         let departureTime = Util.Date.toDate(`${departureDate.format('yyyy-MM-dd')} ${ticket.start_time}`)
            //         if (twoLaterDate >= oldDep && new Date().format('yyyy-MM-dd') !== oldDep.format('yyyy-MM-dd') && oldLastTime <= departureTime) {
            //             this.toastMsg('由于铁路局规定，您的车票只能改签到票面日期当日以及票面日前之前的列车');
            //             return;
            //         }
            //     }
            // }
            ticket.selectedSeat = item;
            ticket.departureDate = departureDate;
            if (reissueOrder) {
                this.push('TrainOrderReissueScreen', {
                    ticket,
                    reissueOrder: reissueOrder,
                });
            } else {
                if (item.checkSeat === 0 && feeType === 1) {
                    this.push('RcReason', { ticket,recommendTrain: recommendTrain, seat ,JourneyId:this.params.JourneyId});
                } else {
                    compSwitch?
                    this.push('Train_compCreateOrderScreen', { ticket, recommendTrain: recommendTrain, seat, JourneyId:this.params.JourneyId})
                    :
                    this.push('TrainCreateOrder', { ticket, recommendTrain: recommendTrain, seat, JourneyId:this.params.JourneyId});
                }
            }
    }

    _renderTrainInfo = () => {
        const { ticket, departureDate,cityList } = this.params;
        let departureTime = Util.Date.toDate(`${departureDate.format('yyyy-MM-dd')} ${ticket.start_time}`);
        let destinationTime = Util.Date.toDate(`${departureTime.addDays(+ticket.arrive_days).format('yyyy-MM-dd')} ${ticket.arrive_time}`);
        cityList&&cityList.map((_item)=>{
            if(_item.Code == ticket.from_station_code){
                ticket.FromStationEnName = _item.EnName
            }else if(_item.Code == ticket.to_station_code){
                ticket.ToStationEnName = _item.EnName
            }
        })
        let FlightDuration = ticket.run_time.replace(':', "h");
        FlightDuration = FlightDuration + 'm';
        return (
            <View>
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:20,backgroundColor:Theme.greenBg,paddingVertical:10}}>
                    <CustomText text={(departureTime && departureTime.format('yyyy-MM-dd')) +' '+departureTime.getWeek()} style={{ color: Theme.theme }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "center" }}>
                            <CustomText style={{ marginRight: 5, color: Theme.theme }} text='预订须知' onPress={this._alertNotice} />
                            <Ionicons name={'chevron-forward'} size={14} color={Theme.theme} />
                    </View>
                </View>
                <View style={{ flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 30, paddingVertical:30,alignItems:'flex-start' }}>
                    <View style={{ flex: 1, justifyContent: 'space-around' }}>
                        <CustomText style={curStyle.detailTimeFont} text={ticket.start_time} />
                        <View style={{flexDirection:'row',alignItems:'center'}}>
                                <View style={{flexDirection:'row',height:14,width:14,backgroundColor:Theme.theme,alignItems:'center',justifyContent:'center',borderRadius:2,marginRight:2}}>
                                    <Feather name={'arrow-up-right'} style={{textAlign:'center'}} size={15} color={'#fff'}/>
                                </View>
                               <CustomText style={curStyle.detailMainFont}  text={Util.Parse.isChinese() ? ticket.from_station_name : ticket.FromStationEnName} />
                        </View>
                    </View>
                    <View style={[{ flex: 1 }, curStyle.center]}>
                        <CustomText style={curStyle.detailMainFont} text={ticket.train_code} />
                        <View style={{ flexDirection: 'row', alignItems: 'center'}}>
                        <Image source={require('../../res/Uimage/arrow.png')} style={{ width: 60, height: 3 }}></Image>
                        </View>
                        <TouchableOpacity style={{flexDirection:'row', alignItems:'center'}} onPress={()=>{this._showDetail(ticket)}}>
                            <CustomText allowFontScaling={false} style={{ color: Theme.aidFontColor,fontSize:12 }} text={FlightDuration} />
                            <Image style={{marginLeft:2,height:5,width:7}} source={require('../../res/Uimage/trainFloder/caret_down.png')}/>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'space-around', alignItems: 'flex-end' }}>
                        <CustomText style={[curStyle.detailTimeFont, { alignItems: 'flex-end' }]} text={ticket.arrive_time} />
                        <View style={{flexDirection:'row',alignItems:'flex-start',justifyContent: 'flex-end'}}>
                            <View style={{flexDirection:'row',height:15,width:15,backgroundColor:Theme.RedMarkColor,alignItems:'center',justifyContent:'center',borderRadius:2,}}>
                                <Feather name={'arrow-down-right'} style={{textAlign:'center'}} size={15} color={'#fff'}/>
                            </View>
                            <CustomText style={[curStyle.detailMainFont, { textAlign:'right'}]}  text={Util.Parse.isChinese() ? ticket.to_station_name : ticket.ToStationEnName} />
                        </View>
                    </View>
                    { 
                        ticket.arrive_days > 0 ?<View style={{ width: 18 }}>
                            <CustomText style={{ color: 'white', fontSize: 12, marginTop: 15 }} text={ticket.arrive_days > 0 ? '+' + ticket.arrive_days : ''} />
                        </View>:null
                    }
                </View>
            </View>
        )
    }

    _showDetail = (ticket,index) => {
        this.priceView.show(ticket);
    }

    _alert = () => {
        Pop.show(
            <View style={curStyle.popStyle}>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',margin:20}}>
                    <CustomText text={'违背政策详情'} style={{fontSize:15,fontWeight:'bold',color:Theme.RedMarkColor}}/>
                    <TouchableOpacity onPress={()=>{Pop.hide()}}>
                    <FontAwesome name='close' size={15} color={Theme.darkColor} style={{marginLeft:10}}></FontAwesome>
                    </TouchableOpacity>
                </View>
                <View style={{width:'100%',height:1,backgroundColor:Theme.lineColor}}></View>
                <View style={{padding:10,backgroundColor:Theme.pinkBg,marginHorizontal:20,marginTop:15,borderRadius:8}}>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                    <FontAwesome name='exclamation-circle' size={15} color={Theme.RedMarkColor} style={{marginLeft:10}}></FontAwesome>
                    <CustomText text={'违背席别限制'} style={{color:Theme.RedMarkColor,marginLeft:5}}/>
                    </View>
                    <CustomText text={'超标弹窗提示'} style={{marginLeft:30}}/>
                </View>
            </View>,
            {animationType: 'slide-up', maskClosable: true, onMaskClose: ()=>{}}
        )

    }

    _renderTicketTypes = () => {
        let { ticket, feeType } = this.params;
        const { customerInfo,isOnlyApply } = this.state;
        const {comp_checkTravellers, compSwitch,customerInfo_userInfo,apply} = this.props;
        let TravellersNum = comp_checkTravellers&&comp_checkTravellers.Travellers&&comp_checkTravellers.Travellers.length     
        let list = ticket.ticketTypes;
        const DisableBook =
            !!customerInfo_userInfo?.customerInfo?.Setting?.DisableBookingOnlyView &&
            !customerInfo_userInfo?.userInfo?.EnableBookingIfCustomerDisable;
        return list.map((item, index) => {
            return (
                <View style={{ flexDirection: 'row', paddingVertical: 15, alignItems: 'center',borderBottomWidth:1, borderColor:Theme.lineColor }} key={index}>
                    <CustomText style={[{ flex: 1 }, curStyle.mainFont]} text={item.seat} />
                    <TouchableOpacity style={{ flex:1 }} onPress={()=>{
                        if(item.checkSeat == 0 && feeType == 1){
                            this._alert();
                        }
                    }}>
                       <CustomText style={{ backgroundColor: (item.checkSeat == 0 && feeType == 1) ?Theme.redColor:Theme.theme, borderRadius: 2, color: '#fff', paddingHorizontal: 5, fontSize: 11, paddingVertical:1,marginRight:4,width:34 }} text={(item.checkSeat == 0 && feeType == 1) ?'违背':'符合'} />
                    </TouchableOpacity>
                    {(item.seatCount || !(TravellersNum>item.seatCount))
                        ?
                        <View style={{ flexDirection: 'row', flex:Util.Parse.isChinese()?1: 1.4 }}>
                            <CustomText style={[curStyle.mainFont]} text={item.seatCount} />
                            <CustomText style={[curStyle.mainFont]} text='张' />
                        </View>
                        :
                        <View style={{ flexDirection: 'row', flex:Util.Parse.isChinese()?1: 1.4 }}>
                            <CustomText style={{ color: 'red'}} text={'已售完'} />
                        </View>
                    }
                    <View style={{flexDirection:'row',flex: 1.2,justifyContent:'flex-end',marginRight:10}}>
                      <CustomText style={[{  color: Theme.theme, fontWeight:'bold',fontSize:16,marginTop:4 }]} text={'¥'} />
                      <CustomText style={[{  color: Theme.theme, fontWeight:'bold',fontSize:20 }]} text={item.price} />
                    </View>
                    {
                        compSwitch?
                            isOnlyApply? 
                            <TouchableHighlight style={DisableBook ? curStyle.btnEnable : curStyle.btn3} 
                                            activeOpacity={1} 
                                            underlayColor='lightgray' 
                                            disabled={ticket.ViolationMode == 1 && item.checkSeat == 0 && feeType == 1 ? true : false} 
                                            onPress={()=>{ 
                                                if (DisableBook && (item.seatCount || !(TravellersNum>item.seatCount))) {
                                                    this.toastMsg("暂无预订权限，请联系差旅顾问");
                                                    return;
                                                }
                                                this.toastMsg("请选择申请单预订"); 
                                            }}
                            >
                            <CustomText style={{ color: 'white',fontSize:14 }} text='预订' />
                            </TouchableHighlight>
                            :
                            <View style={{ flex: 1, flexDirection: 'row-reverse' }}>
                                {   TravellersNum>item.seatCount?
                                    <TouchableHighlight style={{backgroundColor:DisableBook ? 'lightgray' : (customerInfo&&customerInfo.Setting.TrainGrabTicket? 'rgba(117,192,152,1)':'lightgray'),
                                                                borderRadius: 2,
                                                                width: 60,
                                                                height: 30,
                                                                justifyContent: 'center',
                                                                alignItems: 'center'}} 
                                    activeOpacity={1} underlayColor='rgba(117,170,152,1)'
                                    disabled={!(customerInfo&&customerInfo.Setting.TrainGrabTicket)} 
                                    onPress={() => {
                                        if (DisableBook && (item.seatCount || !(TravellersNum>item.seatCount))) {
                                            this.toastMsg("暂无预订权限，请联系差旅顾问");
                                            return;
                                        }
                                        this._trainReserve(item);
                                    }}
                                    >
                                    <CustomText style={{ color: 'white',fontSize:14 }} text={customerInfo&&customerInfo.Setting.TrainGrabTicket?'抢票':'预订'} />
                                    </TouchableHighlight>
                                    :
                                    <TouchableHighlight style={(DisableBook || (ticket.ViolationMode == 1 && item.checkSeat == 0 && feeType == 1) ||(this.props.highRisk && this.props.highRisk.Level==2)) ? curStyle.btnEnable : curStyle.btn} activeOpacity={1} underlayColor='lightgray' disabled={ticket.ViolationMode == 1 && item.checkSeat == 0 && feeType == 1 ? true : false} 
                                    onPress={() => {
                                        if (DisableBook && (item.seatCount || !(TravellersNum>item.seatCount))) {
                                            this.toastMsg("暂无预订权限，请联系差旅顾问");
                                            return;
                                        }
                                        this._trainReserve(item);
                                    }}>
                                       <CustomText style={{ color: 'white',fontSize:14 }} text='预订' />
                                    </TouchableHighlight>
                                }
                                
                                {/* {TravellersNum>item.seatCount? <CustomText style={{ fontSize: 9, color: 'red', marginRight: 5 }} text='已售完' /> : null} */}
                            </View>
                        :
                        isOnlyApply? 
                        <TouchableHighlight style={DisableBook ? curStyle.btnEnable : curStyle.btn3} 
                                           activeOpacity={1} 
                                           underlayColor='lightgray' 
                                           disabled={ticket.ViolationMode == 1 && item.checkSeat == 0 && feeType == 1 ? true : false} 
                                           onPress={()=>{ 
                                              if (DisableBook && (item.seatCount || !(TravellersNum>item.seatCount))) {
                                                  this.toastMsg("暂无预订权限，请联系差旅顾问");
                                                  return;
                                              }
                                              this.toastMsg("请选择申请单预订"); 
                                           }}
                        >
                       <CustomText style={{ color: 'white' }} text='预订' />
                       </TouchableHighlight>
                       :
                        <View style={{ flex: 1, flexDirection: 'row-reverse' }}>
                                {   item.seatCount==0?
                                    <TouchableHighlight style={{backgroundColor:DisableBook ? 'lightgray' : (customerInfo&&customerInfo.Setting.TrainGrabTicket? 'rgba(117,192,152,1)':'lightgray'),
                                                                borderRadius: 2,
                                                                width: 60,
                                                                height: 30,
                                                                justifyContent: 'center',
                                                                alignItems: 'center'}} 
                                    activeOpacity={1} underlayColor='rgba(117,170,152,1)'
                                    disabled={!(customerInfo&&customerInfo.Setting.TrainGrabTicket)} 
                                    onPress={() => {
                                        if (DisableBook && (item.seatCount || !(TravellersNum>item.seatCount))) {
                                            this.toastMsg("暂无预订权限，请联系差旅顾问");
                                            return;
                                        }
                                        this._trainReserve(item);
                                    }}>
                                    <CustomText style={{ color: 'white',fontSize:14 }} text={customerInfo&&customerInfo.Setting.TrainGrabTicket?'抢票':'预订'} />
                                    </TouchableHighlight>
                                    :
                                    <TouchableHighlight style={(DisableBook || (ticket.ViolationMode == 1 && item.checkSeat == 0 && feeType == 1) || (this.props.highRisk && this.props.highRisk.Level==2)) ? curStyle.btnEnable : curStyle.btn} activeOpacity={1} underlayColor='#D16403' disabled={ticket.ViolationMode == 1 && item.checkSeat == 0 && feeType == 1 ? true : false} onPress={() => {
                                        if (DisableBook && (item.seatCount || !(TravellersNum>item.seatCount))) {
                                            this.toastMsg("暂无预订权限，请联系差旅顾问");
                                            return;
                                        }
                                        this._trainReserve(item);
                                    }}>
                                    <CustomText style={{ color: 'white',fontSize:14 }} text='预订' />
                                    </TouchableHighlight>
                                }
                                {/* {item.checkSeat == 0 && feeType == 1 ? <CustomText style={{ fontSize: 9, color: 'red', marginRight: 5 }} text='超标' /> : null} */}
                            </View>
                    }
                </View>
            );
        });
    }

    renderBody() {
        return (
            <View style={{  }}>
                {this._renderTrainInfo()}
                <ScrollView style={{  margin: 10,padding:20,backgroundColor:'#fff',borderRadius:6 }} keyboardShouldPersistTaps='handled'>
                    {this._renderTicketTypes()}
                </ScrollView>
                {this._testAlert()}
                <TrainlistView ref={o => this.priceView = o} />
            </View>
        )
    }

    _testAlert = () => {
        const {alertShow} = this.state;
        if (!this.props.highRisk || !this.props.highRisk.Level ==1 || !alertShow){return}
        return(
          <View  style={{position:'absolute',top:-94, height:global.screenHeight, width:global.screenWidth}}>
            <View style={curStyle.container2}>
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
        const {itemData} = this.state;
        this._toNextOrder(itemData);
        this.setState({alertShow:false});
    }
}
const getStatusProps = state => ({
    compSwitch: state.compSwitch.bool,
    comp_checkTravellers: state.comp_checkTravellers.travellers,
    highRisk:state.highRisk.highRisk,
    customerInfo_userInfo: state.customerInfo_userInfo,
    apply:state.apply.apply,
    comp_userInfo:state.comp_userInfo,

})
export default connect(getStatusProps)(TrainTicketDetailScreen)
const curStyle = StyleSheet.create({
    detailMainFont: {
        color: Theme.commonFontColor
    },
    detailAidFont: {
        fontSize: 12
    },
    detailTimeFont: {
        fontSize: 25,
        fontWeight:'bold'
    },
    mainFont: {
        fontSize: 14,
    },
    btn: {
        backgroundColor: Theme.theme,
        borderRadius: 2,
        width: 60,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btn3: {
        backgroundColor: 'lightgray',
        borderRadius: 2,
        width: 60,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btn1: {
        backgroundColor: 'rgba(117,192,152,1)',  
        borderRadius: 2,
        width: 60,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop:10
    },
    btnEnable: {
        backgroundColor: 'lightgray',
        borderRadius: 2,
        width: 60,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
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
    }    
});