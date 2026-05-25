import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    DeviceEventEmitter,
    TouchableOpacity,
    TouchableHighlight,
    ImageBackground,
    Image,
} from 'react-native';
import SuperView from '../../super/SuperView';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import HeaderView from './HeaderView';
import HeaderView1 from './HeaderView1';
import Util from '../../util/Util';
import CustomText from '../../custom/CustomText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Theme from '../../res/styles/Theme';
import I18nUtil from '../../util/I18nUtil';
import CustomActioSheet from '../../custom/CustomActionSheet';
import CustomeTextInput from '../../custom/CustomTextInput';
import TrainEnum from '../../enum/TrainEnum';
import TrainService from '../../service/TrainService';
import ViewUtil from '../../util/ViewUtil';
import NavigationUtils from '../../navigator/NavigationUtils';
import Key from '../../res/styles/Key';
import UserInfoDao from '../../service/UserInfoDao';
import SeatView from './SeatView';
import CommonService from '../../service/CommonService';
import  LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
export default class TrainReissueScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '改签申请',
            statusBar: {
                backgroundColor: Theme.theme,
            },
            // hide:true,
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
            showTrainDetail: true,
            options: ['因公司原因行程改签', '因个人原因行程改签', '其他'],
            reasonDesc: '',
            reasonCode: '',
            inputReason: '',
            IsNightConfirm: false,
            // 选择的座席
            selectSeat: [],
            login12306Name:null,
            login12306Data:null,
            Is12306Login:false,
            customerInfo: {}
        }
    }

    componentDidMount = ()=> {
        this._loadAgain();
        this.backFromShopListener = DeviceEventEmitter.addListener(
            'load123',  //监听器名
            () => {
                this._loadAgain();
            },
        );
    }

    _loadAgain=()=>{
        CommonService.customerInfo().then(response => {
            this.setState({
                customerInfo:response.data
            },()=>{
                this._getTrainLink(response.data);
            })
        }).catch(error => {
            this.toastMsg(error.message || '获取数据异常');
        })
    }

    _getTrainLink=(customerInfo)=>{
        if(customerInfo&&customerInfo.TrainAccount){
          //获取完信息先免密登录12306---------------------------
          this.hideLoadingView();
              let model = {
                  TrainAccount:customerInfo.TrainAccount
              } 
              this.showLoadingView(); 
              TrainService.Train12306AutoLogin(model).then(response =>{
                  this.hideLoadingView();
                  if(response.success){
                        this.setState({
                              login12306Name:customerInfo.TrainAccount,
                              login12306Data:customerInfo.TrainAccountId,
                              Is12306Login:true
                            //   trainLinkloading:true,
                        })
                  }else{
                    this.setState({
                        // trainLinkloading:true,
                    })
                  }
              }).catch(error=>{
                  this.hideLoadingView();
                  this.toastMsg(error || '操作失败');
              })
        }else{
            this.setState({
                // trainLinkloading:true,
            })
        }
    }

    // 退改规则
    _showRules = () => {
        // this.showAlertView(Util.Parse.isChinese() ? TrainEnum.trainOrderNotice.cn : TrainEnum.trainOrderNotice.en);
        const { ticket } = this.params;
        let _alertA = Util.Parse.isChinese() ? TrainEnum.trainOrderNotice.cn : TrainEnum.trainOrderNotice.en
        let _alertB = Util.Parse.isChinese() ? TrainEnum.trainOrderNoticeGSG.cn : TrainEnum.trainOrderNoticeGSG.en
        this.showAlertView( (ticket.from_station_code==="XJA" || ticket.to_station_code==="XJA") ? _alertB : _alertA );
    }

    /**
     *  选择原因
     */
    _selectReason = () => {
        this.actionSheet.show();
    }
    /**
     *  选择改签原因
     */
    _handlePress = (index) => {
        this.setState({
            reasonCode: index + 1,
            reasonDesc: this.state.options[index]
        })
    }

    /**
     *  确定改签
     */
    _submitReissue = () => {
        const { ticket, reissueOrder } = this.params;
        const { customerInfo,login12306Data } = this.state;
        if(customerInfo&&customerInfo.Setting&&customerInfo.Setting.IsNeedBind12306 && !login12306Data){
            this.toastMsg('请关联12306账号');
            return;
        }
        let alertA = Util.Parse.isChinese()? TrainEnum.trainChangeNotice.cn : TrainEnum.trainChangeNotice.en
        let alertB = Util.Parse.isChinese()? TrainEnum.trainChangeNoticeGSG.cn : TrainEnum.trainChangeNoticeGSG.en
        if(reissueOrder.Amount-ticket.selectedSeat.price>0){
            this.showAlertView((ticket.from_station_code==="XJA" || ticket.to_station_code==="XJA")?alertB:alertA, () => {
                return ViewUtil.getAlertButton('取消', () => {
                    this.dismissAlertView();
                    this.pop();
                }, '继续提交', () => {
                    this.dismissAlertView();
                    this._gaiqianClick();
                })
            })
        }else{
            let serviceMany='';
            UserInfoDao.getCustomerInfo().then(response => {
                serviceMany = reissueOrder.IsVip?response.TrainReissueVipServiceCharge:response.TrainReissueServiceCharge
                let alertStr = `提交改签将产生改签费用：\n应付费用：服务费${serviceMany?serviceMany:0}元；\n应付票款：${ticket.selectedSeat.price-reissueOrder.Amount}； \n合计应付：${ticket.selectedSeat.price-reissueOrder.Amount+(serviceMany?serviceMany:0)}；\n是否继续提交改签？`
                let EnAlertStr = `Costs incurred for the change:\nNeed to pay：Service charge${serviceMany?serviceMany:''}￥；\nTicket fee：${ticket.selectedSeat.price-reissueOrder.Amount}； \nTotal：${ticket.selectedSeat.price-reissueOrder.Amount+(serviceMany?serviceMany:0)}；\nDo you want to continue submitting?`
                this.showAlertView(Util.Parse.isChinese()? alertStr:EnAlertStr, () => {
                    return ViewUtil.getAlertButton('取消', () => {
                        this.dismissAlertView();
                        this.pop();
                    }, '继续提交', () => {
                        this.dismissAlertView();
                        this._gaiqianClick();
                    })
                })
            }).catch(error => {
                this.toastMsg(error.message || '获取数据异常');
            })    
           
        }
    
    }
    _gaiqianClick = () =>{
        const { ticket, reissueOrder } = this.params;
        const { reasonCode, inputReason,selectSeat,login12306Data,Is12306Login } = this.state;
        let departureTime = Util.Date.toDate(`${ticket.departureDate.format('yyyy-MM-dd')} ${ticket.start_time}`);
        let destinationTime = Util.Date.toDate(`${ticket.departureDate.addDays(+ticket.arrive_days).format('yyyy-MM-dd')} ${ticket.arrive_time}`)
        let reissueModel = {
            OrderId: reissueOrder.Id,
            TrainInfo: {
                Checi: ticket.train_code,
                FromStationCode: ticket.from_station_code,
                FromStationName: ticket.from_station_name,
                ToStationCode: ticket.to_station_code,
                ToStationName: ticket.to_station_name,
                TrainDate: ticket.departureDate && ticket.departureDate.format('yyyy-MM-dd', true),
                Zwcode: ticket.selectedSeat.seatCount,
                Zwname: ticket.selectedSeat.seat,
                ArriveDate: destinationTime && destinationTime.format('yyyy-MM-dd', true),
                StartTime: ticket.start_time,
                ArriveTime: ticket.arrive_time,
                RunTime: ticket.runTimeDesc,
                TicketType: "1",
                DepartureTime: departureTime,
                ArrivalTime: destinationTime,
                Price: ticket.selectedSeat.price,
                DepartureCity: reissueOrder.TrainInfo.DepartureCity,
                DepartureCityCode: reissueOrder.TrainInfo.DepartureCityCode,
                ArrivalCity: ticket.SearchToCity.toCityName,
                ArrivalCityCode: ticket.SearchToCity.toCityCode,
                EmployeeTrainAccountId:login12306Data,
                Is12306Login:Is12306Login
            },
            ChooseSeats:selectSeat&&selectSeat[0],
            IsChooseSeats:selectSeat&&selectSeat.length>0 ? true : false,
            ReasonCode: reasonCode,
            ReasonDesc: inputReason,
            Platform: Platform.OS,
            IsNightConfirm: this.state.IsNightConfirm
        };
        this.showLoadingView();
        TrainService.orderReissue(reissueModel).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if (response.code == 201 && response.data) {
                    this.push('TrainPayment', { SerialNumber: response.data.payment.SerialNumber });
                } else {
                        this.showAlertView('提交改签成功', () => {
                        return ViewUtil.getAlertButton('确定', () => {
                            this.dismissAlertView();
                            DeviceEventEmitter.emit(Key.TrainOrderListChange, reissueOrder);
                            NavigationUtils.popToTop(this.props.navigation);
                            DeviceEventEmitter.emit('goHome', {});
                        })
                     })
                   
                }
            } else if (response.code == '7') {
                this.showAlertView(response.message, () => {
                    return ViewUtil.getAlertButton('取消', () => {
                        this.dismissAlertView();
                    }, '继续预订', () => {
                        this.dismissAlertView();
                        this.setState({
                            IsNightConfirm: true
                        }, () => {
                            this._submitReissue();
                        })
                    })
                })
            } else {
                this.toastMsg(response.message || '提交改签失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '提交改签异常');
        })

    }
    /**
     *  重新选择
     */
    _resetSelect = () => {
        this.pop();
    }

    renderBody() {
        const { reissueOrder, ticket } = this.params;
        const { reasonDesc, options, selectSeat, customerInfo } = this.state;
        const { TrainInfo: trainInfo, Amount} = this.params.reissueOrder;
        let nameStr=''
        if(reissueOrder.PassengerName){
            nameStr= reissueOrder.PassengerName || (reissueOrder.PassengerName?.Name)
        }else{
            nameStr= reissueOrder.OrderTravellerDesc
        }
        return (
            <LinearGradient  start={{x: 1, y: 0}} end={{x: 1, y: 0.5}} style={{flex:1}} colors={[Theme.theme,Theme.normalBg]}>
                {/* <View style={{flexDirection:'row',paddingHorizontal:15,justifyContent:'space-between',height:44,alignItems:'center'}}>
                    <TouchableOpacity onPress={()=>{this._resetSelect()}}>
                        <AntDesign name={'arrowleft'} size={20} color={'#fff'} />
                    </TouchableOpacity>
                    <CustomText text={'改签申请'} style={{fontSize:16, color:'#fff'}} />
                    <CustomText style={{fontSize:16, color:'#fff'}} text={''}></CustomText>
                </View> */}
                <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" style={{flex:1}} showsVerticalScrollIndicator={false}>
                    <HeaderView1 trainInfo={trainInfo} Amount={Amount} titleTxt={'原'} otwThis={this}/>
                    <HeaderView ticket={ticket} otwThis={this} titleTxt={'改'} />
                    {customerInfo&&customerInfo.Setting&&customerInfo.Setting.IsShowBind12306?this._renderRelate():null}
                    <View style={{margin:10,borderRadius:6,padding:10,backgroundColor: "white",}}>
                        <View style={{  paddingHorizontal: 10, paddingVertical: 10,flexDirection:'row' }}>
                                <Image source={require('../../res/Uimage/shu.png')} style={{width:14,height:14}}/>
                                <CustomText text={`${I18nUtil.translate('乘车人')}：${nameStr}`} />
                        </View>
                        <View style={{ height: 1, backgroundColor: Theme.lineColor }}></View>
                        <TouchableHighlight underlayColor='transparent' onPress={this._selectReason}>
                            <View style={{ backgroundColor: "white", alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 15 }}>
                                <CustomText text={reasonDesc ? reasonDesc : '请选择改签原因'} />
                                <Ionicons name={'chevron-forward'} size={22} color={'lightgray'} />
                            </View>
                        </TouchableHighlight>
                    </View>
                    <CustomeTextInput style={styles.input} placeholder='请输入改签原因' maxLength={125} multiline={true} onChangeText={text => this.setState({ inputReason: text })} />
                    <SeatView
                        ticket={ticket}
                        selectSeat={selectSeat}
                        selectSeatFrom={true}
                    />
                    <View style={{height:38}}></View>
                    <CustomActioSheet ref={o => this.actionSheet = o} options={options} onPress={this._handlePress} />
                </KeyboardAwareScrollView>
                {/* <View style={{ backgroundColor: Theme.orangeBg, padding: 10,borderRadius:6 , justifyContent: 'center', alignItems: 'center' }}>
                    <CustomText text='实际收取的退改签手续费以12306网站具体规定为准' style={{fontSize:12,color:Theme.orangeColor}}/>
                </View> */}
                {
                    ViewUtil.getTwoBottomBtn('重新选择',this._resetSelect,'确定改签',this._submitReissue)
                }
            </LinearGradient>    
        )
    }
    /**关联12306 */
    _renderRelate =()=>{
        const{login12306Name}=this.state;
        return(
        <View style={styles.viewStyle}>  
            <View style={{flexDirection:'row',alignItems:'center'}}>
                <ImageBackground style={{width:38,height:38}} source={require('../../res/Uimage/trainFloder/train12306.png')}/>
                {login12306Name?
                <View style={{flexDirection:'row',flex:1,justifyContent:'space-between'}}>
                    <View style={{flexDirection:'column'}}>
                        <CustomText style={{fontSize:14,marginLeft:10}} text={login12306Name}/>
                        <CustomText style={{fontSize:12,marginLeft:10,color:Theme.theme}} text={'已关联'}/>
                    </View>
                    <View style={{flexDirection:'row',alignItems:'center',flex:3}}>
                        <TouchableOpacity onPress={this._logoutClick} style={styles.toucStyle}>
                            <CustomText style={{fontSize:14,color:'#fff',paddingHorizontal:10}} text={'退出'}></CustomText>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={this._relateClick2} style={styles.toucStyle2}>
                            <CustomText style={{fontSize:14,color:'#fff',paddingHorizontal:10}} text={'切换'}></CustomText>
                        </TouchableOpacity>
                    </View>
                </View>
                :
                <View style={{flexDirection:'row',alignItems:'center'}}>
                    <View style={{width:230,marginLeft:10}}>
                        <CustomText style={{fontSize:14,fontWeight:'bold'}} text='铁路局规定购票必须实名制'/>
                        <CustomText style={{marginTop:5,fontSize:12,}} text='登录12306账号提高出票成功率' />
                    </View>
                    <TouchableOpacity onPress={this._relateClick1} style={styles.toucStyle3}>
                            <CustomText style={{fontSize:14,color:'#fff'}} text={'关联'}></CustomText>
                    </TouchableOpacity>
                </View>
                }
            </View>
         </View> 
        )
    }
        //退出绑定12306
    _logoutClick =() =>{
        this.showLoadingView();
        const {login12306Name} = this.state;
        let model = {
                trainAccount:login12306Name, 
        }
        TrainService.TrainAccountCancelApp(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                this.setState({
                    login12306Name:null,
                    login12306Data:null
                })
            } else {
                this.toastMsg(response.message || '退出12306账号失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '退出12306账号异常');
        })
    
    }

    _relateClick1= ()=>{
        this.push('TrainRelateScreen',{callBack:(name,passWord,data)=>{
            this.setState({
                login12306Name:name,
                passWord:passWord,
                login12306Data:data
            })
        }})
    }
    _relateClick2= ()=>{
        this.push('TrainRelateScreen',{_switch:true, callBack:(name,passWord,data)=>{
            this.setState({
                login12306Name:name,
                passWord:passWord,
                login12306Data:data
            })
        }})
    }

}
const styles = StyleSheet.create({
    input: {
        marginHorizontal: 10,
        height: 80,
        backgroundColor: 'white',
        padding: 10,
        borderRadius:6
    },
    btn: {
        flex: 1,
        backgroundColor: Theme.theme,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        height: 40
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    detailAidFont: {
        fontSize: 12,
        color: Theme.aidFontColor
    },
    detailMarkFont: {
        fontSize: 12,
        color: Theme.annotatedFontColor
    },
    detailTimeFont: {
        fontSize: 25
    },
    aidFont: {
        color: Theme.aidFontColor,
        fontSize: 15
    },
    viewStyle:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        padding:10,
        alignContent:'center',
        backgroundColor:'#fff',
        marginHorizontal:10,
        borderRadius:6
    },
    toucStyle:{
        height:28,
        backgroundColor:Theme.theme,
        borderRadius:4,
        justifyContent:'center',
        alignItems:'center',
        borderStartWidth:1,
        borderColor:Theme.theme
    },
    toucStyle2:{
        height:28,
        backgroundColor:Theme.theme,
        borderRadius:4,
        justifyContent:'center',
        alignItems:'center',
        marginLeft:5
    },
    toucStyle3:{
        right:10,
        height:28,
        backgroundColor:Theme.theme,
        borderRadius:4,
        justifyContent:'center',
        alignItems:'center'
    }
})