import React from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Text,
    Dimensions,
    TouchableOpacity,
    DeviceEventEmitter
} from 'react-native';
import SuperView from '../../super/SuperView';
import HeaderView from './HeaderView';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import OrderSureBottom from '../common/OrderSureBottom';
import PassengerSureView from '../common/PassengerSureView';
import { connect } from 'react-redux';
import Util from '../../util/Util';
import BackPress from '../../common/BackPress';
import ComprehensiveService from '../../service/ComprehensiveService';
import Touchable from '../../util/TouchableUtil';
import  LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import ViewUtil from '../../util/ViewUtil';


const screenWith = Dimensions.get('screen').width
class Train_compOrderSureScreen extends SuperView {
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
            isStop: false
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
        const {seat,PassengerList, travellersList_comp} = this.params;
        const {comp_userInfo,comp_travelers} = this.props
        let Reference_employeeId = (comp_userInfo&&comp_userInfo.ReferenceEmployeeId)?(comp_userInfo&&comp_userInfo.ReferenceEmployeeId):(comp_travelers&&comp_travelers.ReferenceEmployeeId)?comp_travelers.ReferenceEmployeeId:null
        let model={
            MassOrderId:null,
            Category:5,//火车
            ReferenceEmployeeId:Reference_employeeId,//差旅规则及审批规则的参照员工ID。如果没有综合订单ID，且有多个出差员工时这个字段必填！（出差员工+当前预订人中的任意一人）
            ProjectId:comp_userInfo&&comp_userInfo.ProjectId,
            Travellers:travellersList_comp
        }
        this.showLoadingView();
        ComprehensiveService.MassOrderCheckTravellers(model).then(response => {
         this.hideLoadingView();
             if (response && response.success&&response.data) {
                 response.data.Travellers.map((item, index)=>{
                     item.Certificate = travellersList_comp[index].Certificate
                    if(travellersList_comp[index].Certificate?.Type == 1){
                        item.Certificate.NationalCode = 'CN'
                        item.Certificate.NationalName = '中国'
                        item.Nationality = 'CN'
                        item.NationalCode = 'CN'
                        item.NationalName = '中国'
                        item.Certificate.IssueNationCode = 'CN'
                        item.Certificate.IssueNationName = '中国'
                    }
                     item.Addition = travellersList_comp[index].Addition
                 })
                 this._reloadProjectList(response.data);
                //  this.push('CompDetailScreen',{data:response.data,comp_userInfo:comp_userInfo,trainData:this.requestModel});
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
        const { compMassOrderId,comp_travelers,comp_userInfo,compCreate_bool,apply } = this.props;
        const { AttachmentModel } = this.params;
        let Reference_employeeId = (comp_userInfo&&comp_userInfo.ReferenceEmployeeId)?(comp_userInfo&&comp_userInfo.ReferenceEmployeeId):(comp_travelers&&comp_travelers.ReferenceEmployeeId)?comp_travelers.ReferenceEmployeeId:null
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
        let model = {
            MassOrderId:compMassOrderId, //compMassOrderId ,综合订单id，有就传值，没有就不传
            RulesTravelId:data.RulesTravelId,//差旅规则id
            Approval:compCreate_bool?data.Approval:comp_travelers.Approval,
            ProjectId: comp_userInfo&&comp_userInfo.ProjectId,//项目id
            Platform: Platform.OS,
            Travellers: data.Travellers,//出差人列表
            DomesticFlights:[],//国内机票航班列表
            IntlFlight:null,//国际机票行程信息
            Hotel: null,//国内酒店信息（包含房型）
            ForeignHotel: null,//港澳台及国际酒店信息（包含房型）
            Train: this.requestModel,//火车票车次信息（包含坐席）
            ReferenceEmployeeId:Reference_employeeId,//差旅规则及审批规则的参照员工ID。如果没有综合订单ID，且有多个出差员工时这个字段必填！（出差员工+当前预订人中的任意一人）
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
            IsClearCardTraveller:false,
            ApplyId:apply&&apply.Id,
            Attachment:AttachmentModel,
            JourneyId: journeyid,
            AdditionInfo:this.requestModel.AdditionInfo,
            ElectronicItineraryInfo:this.requestModel.ElectronicItineraryInfo
        }
        this.showLoadingView()
        ComprehensiveService.MassOrderCreate(model).then(response => {
            this.hideLoadingView()  
            if (response && response.success) {
                if (response.data) {
                    DeviceEventEmitter.emit('freshCompDetail', {orderId:response.data.Id,isStop:true});
                    this.push('CompDetailScreen',{orderId:response.data.Id,isStop:true}); 
                }
           }else{
            // this.toastMsg(response.message || '加载数据失败请重试');
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
                }else{
                    this.toastMsg(response.message || '加载数据失败请重试');
                }
           }
        }).catch(error => {
            this.hideLoadingView()
            this.toastMsg(error.message || '加载数据失败请重试');
        })
    }
    _renderGrabvotes = () => {
        const {selectData,trainCodeList,setOptions,TrainDiedline,diedlineTime,seat} = this.params
        let checiArray = [];
        let xiweiArray = []
        this.requestModel.OrderTrain.GrabSelectTrains.map((item)=>{
            checiArray.push(item.Checi)
            xiweiArray.push(item.Zwname)     
        })
        let obj = {};
        let returnCheci = checiArray.filter(function (item, index, arr) {
                return obj.hasOwnProperty(typeof item + JSON.stringify(item)) ? false : (obj[typeof item + JSON.stringify(item)] = true);
            });
        let returnXiwei = xiweiArray.filter(function (item, index, arr) {
                return obj.hasOwnProperty(typeof item + JSON.stringify(item)) ? false : (obj[typeof item + JSON.stringify(item)] = true);
        });
        return(
            seat===0?
            <View>
                    <View style={styles.bxStyle}>
                        <View style={{flexDirection:'row'}}>
                        <CustomText text={'备选日期'} />
                        <CustomText style={{marginLeft:10 ,color:Theme.fontColor,width:screenWith-100}}  
                                    text={this.requestModel.OrderTrain.GrabTrainDate} />
                        </View>
                    </View>
               
               
                    <View style={styles.bxStyle}>
                        <View style={{flexDirection:'row'}}>
                        <CustomText text={'备选车次'} />
                        <CustomText style={{marginLeft:10,color:Theme.fontColor}} 
                                    text={returnCheci.join('、')} />
                        </View>
                    </View>
              
                
                    <View style={styles.bxStyle}>
                        <View style={{flexDirection:'row'}}>
                            <CustomText text={'备选席位'} />
                            <CustomText style={{marginLeft:10,color:Theme.fontColor,width:screenWith-100}} 
                                        text={returnXiwei.join('、')} />
                        </View>
                    </View>
               
            
                <View style={styles.bxStyle2}>
                    <View style={{flexDirection:'row'}}>
                      <CustomText style={{ fontWeight: 'bold' }} text={'截至抢票时间:'} />
                      {
                          diedlineTime?
                            <View style={{flexDirection:'row'}}>
                                <CustomText text={'( 我们将为您抢票至'} />
                                <CustomText style={{color:Theme.theme }} text={diedlineTime} />
                                {/* <CustomText style={{color:Theme.theme }} text={TrainDiedline&&TrainDiedline[0]} /> */}
                                <CustomText text={'为止。)'} />
                            </View>
                          :null
                      }
                </View>
                </View>
            </View>:null
        )
    }

    _renderFooter = () => {
        const { customerInfo, totalPrice ,TrainPrice,seat} = this.params;
        return (
            <View style={{ flexDirection: 'row', height: 45, backgroundColor: 'white' , alignItems: 'center'}}>
                <View style={{ flex: 7, marginVertical: 10, marginHorizontal: 5, justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
                            <CustomText style={{ marginLeft: 10, color:'#ff7a03' , fontSize: 16,fontWeight:'bold',marginTop:2 }} text={'¥' } />
                            <Text allowFontScaling={false} style={{ color: '#ff7a03', fontSize: 18 }}>{TrainPrice?TrainPrice:totalPrice}</Text>
                            {
                                    <CustomText style={{ fontSize: 10, color: '#666' }} text='（含服务费）' />
                            }
                        </View>
                    </View>
                </View>
                <Touchable onPressWithSecond={3000}
                        onPress={()=>{
                            this._orderBtnClick()
                        }}
                    >
                       <View style={styles.bottom_btn}>
                          <CustomText style={{ fontSize: 18, color: 'white' }} text={seat===0?"开始抢票":'生成订单'} />
                       </View>
                </Touchable>
            </View>
        )
    }
    
    renderBody() {
        const { ticket, AdditionInfo, customerInfo, requestModel, ApproveList, PassengerList } = this.params;
        return (
            <LinearGradient start={{x: 1, y: 0}} end={{x: 1, y: 0.5}} style={{flex:1}} colors={[Theme.theme,Theme.normalBg]}>
                <ScrollView keyboardShouldPersistTaps='handled'>
                    <HeaderView
                        ticket={ticket}
                        otwThis={this}
                    />
                    {this._renderGrabvotes()}
                    <PassengerSureView feeType={this.props.feeType} PassengerList={PassengerList} ApproveList={ApproveList} customerInfo={customerInfo} from={'train'} />
                    <OrderSureBottom AdditionInfo={AdditionInfo} customerInfo={customerInfo} from={'train'} />
                </ScrollView>
                {this._renderFooter()}
            </LinearGradient>
        )
    }
}
const getStateProps = state => ({
    feeType: state.feeType.feeType,
    comp_userInfo:state.comp_userInfo,
    comp_travelers: state.comp_travelers.travellers,
    compMassOrderId: state.compMassOrderId.massOrderId,
    compCreate_bool: state.compCreate_bool.bool,
    apply: state.apply.apply,
})

export default connect(getStateProps)(Train_compOrderSureScreen);
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
    bxStyle: {
        height: 44,
        paddingHorizontal: 10,
        flexDirection: "row",
        justifyContent: 'space-between',
        alignItems: "center",
        backgroundColor:'#fff',
        marginBottom:1
        
    },
    bxStyle2: {
        height: 44,
        paddingHorizontal: 10,
        flexDirection: "row",
        justifyContent: 'space-between',
        alignItems: "center",
        backgroundColor:'#fff', 
    },
})