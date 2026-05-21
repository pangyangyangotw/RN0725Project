import React from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    Dimensions,
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
import TrainService from '../../service/TrainService';
import Util from '../../util/Util';
import ViewUtil from '../../util/ViewUtil';
import NavigationUtils from '../../navigator/NavigationUtils';
import I18nUtil from '../../util/I18nUtil';
import BackPress from '../../common/BackPress';
import Touchable from '../../util/TouchableUtil';
import  LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';



const screenWith = Dimensions.get('screen').width
class TrainOrderSureScreen extends SuperView {
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
        const {seat} = this.params;
        this.requestModel?.PassengerList?.forEach((item) => {
            if(item.Credentials&&item.Credentials.Type == 1){
                item.Credentials.NationalCode = 'CN'
                item.Credentials.NationalName = '中国'
                item.Nationality = 'CN',
                item.NationalName = '中国'
                item.NationalCode = 'CN'
                item.Credentials.IssueNationCode = 'CN'
                item.Credentials.IssueNationName = '中国'

            }
        })
        let model = {
            Data: JSON.stringify(this.requestModel),
        }
        this.showLoadingView();
        TrainService.createOrder(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if (response.code == 201 && response.data) {
                    this.push('TrainPayment', { SerialNumber: response.data.payment.SerialNumber });
                } else {
                    this.setState({
                        isStop: true
                    }, () => {
                        this.showAlertView(seat?'订单生成成功，您可去我的订单中查看':'抢票中，您可去我的订单中查看', () => {
                            return ViewUtil.getAlertButton('取消', () => {
                                this.dismissAlertView();
                                NavigationUtils.popToTop(this.props.navigation);
                                InteractionManager.runAfterInteractions(() => {
                                    DeviceEventEmitter.emit('deleteApply', {});
                                });
                            }, '确定', () => {
                                this.push('TrainOrderListScreen');
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
                } else if (response.code == 4) {
                    let str = I18nUtil.translate('Vip服务费') + response.data.VipServiceCharge + ',' + I18nUtil.translate('服务费') + response.data.ServiceCharge + I18nUtil.translate('您确定继续预订吗？');
                    this.showAlertView(str, () => {
                        return ViewUtil.getAlertButton('取消', () => {
                            this.dismissAlertView();
                            this.pop();
                        }, '确定', () => {
                            this.requestModel.ServiceCharge = response.data.ServiceCharge;
                            this.requestModel.VipServiceCharge = response.data.VipServiceCharge;
                            this.dismissAlertView();
                            this._orderBtnClick();
                        })
                    })
                } else if (response.code == 7) {
                    this.showAlertView(response.message, () => {
                        return ViewUtil.getAlertButton('取消预订', () => {
                            this.dismissAlertView();
                            this.requestModel.IsNightConfirm = false;
                            NavigationUtils.popToTop(this.props.navigation);
                            InteractionManager.runAfterInteractions(() => {
                                DeviceEventEmitter.emit('deleteApply', {});
                            });
                        }, '继续预订', () => {
                            this.dismissAlertView();
                            this.requestModel.IsNightConfirm = true;
                            this._orderBtnClick();
                        })
                    })
                } else {
                    this.showAlertView(response.message || '提交订单失败出错,请重试!', () => {
                        return ViewUtil.getAlertButton('确定', () => {
                            this.dismissAlertView();
                            this.requestModel.IgnoreConfirm = 0;
                            this.requestModel.IsNightConfirm = false;
                            this.pop();
                        })
                    })
                }
            }
        }).catch(error => {
            this.hideLoadingView();
            this.requestModel.IgnoreConfirm = 0;
            this.requestModel.IsNightConfirm = false;
            this.toastMsg(error.message || '提交订单失败出错,请重试!');
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
        const { customerInfo, totalPrice ,TrainPrice,ServiceFeesData,seat} = this.params;
        let showServiceCharge =   ServiceFeesData && ServiceFeesData.IsShowServiceFee;
        return (
            <View style={{ flexDirection: 'row', height: 50, backgroundColor: 'white', alignItems: 'center' }}>
                <View style={{ flex: 7, marginVertical: 10, marginHorizontal: 5, justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
                            <CustomText style={{ marginLeft: 10, color:Theme.theme , fontSize: 16,fontWeight:'bold',marginTop:2 }} text={'¥' } />
                            <Text allowFontScaling={false} style={{ color: Theme.theme, fontSize: 18 }}>{TrainPrice?Number(TrainPrice).toFixed(2):Number(totalPrice).toFixed(2)}</Text>
                            {
                                showServiceCharge ? (
                                    <CustomText style={{ fontSize: 10, color: '#666' }} text='（含服务费）' />
                                ) : null
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
                          <CustomText style={{ fontSize: 16, color: 'white' }} text={seat===0?"开始抢票":'生成订单'} />
                       </View>
                </Touchable>
            </View>
        )
    }
    _LeftTitleBtn(){
        this.pop();
    }
    renderBody() {
        const { ticket, AdditionInfo, customerInfo, requestModel, ApproveList, PassengerList } = this.params;
        return (
            <LinearGradient start={{x: 1, y: 0}} end={{x: 1, y: 0.5}} style={{flex:1}} colors={[Theme.theme,Theme.normalBg]}>
                {/* <View style={{flexDirection:'row',paddingHorizontal:15,justifyContent:'space-between',height:44,alignItems:'center'}}>
                    <TouchableOpacity onPress={()=>{this._LeftTitleBtn()}}>
                        <AntDesign name={'arrowleft'} size={20} color={'#fff'} />
                    </TouchableOpacity>
                    <CustomText style={{fontSize:16, color:'#fff'}} text={'订单确认'}></CustomText>
                    <CustomText style={{fontSize:16, color:'#fff'}} text={''}></CustomText>
                </View> */}
                <ScrollView keyboardShouldPersistTaps='handled'>
                    <HeaderView
                        ticket={ticket}
                        otwThis={this}
                    />
                    {this._renderGrabvotes()}
                    <PassengerSureView feeType={this.props.feeType} PassengerList={PassengerList} ApproveList={ApproveList} customerInfo={customerInfo} from={'train'} fromNo={8} />
                    <View style={{marginHorizontal:10,backgroundColor:'#fff',paddingHorizontal:20,paddingVertical:10,borderRadius:6,marginTop:10}}>
                        <CustomText style={{width:'30%'}} text={'联系人'}></CustomText>
                        <View style={{flexDirection:'row',marginTop:10}}>
                            <CustomText style={{width:'30%'}} text={'联系电话'}></CustomText>
                            <CustomText style={{width:'70%',color:Theme.commonFontColor}} text={requestModel.OrderTrain?.Contact?.Mobile}></CustomText>
                        </View>
                        <View style={{flexDirection:'row',marginTop:10}}>
                            <CustomText style={{width:'30%'}} text={'Email'}></CustomText>
                            <CustomText style={{width:'70%',color:Theme.commonFontColor}} text={requestModel.OrderTrain?.Contact?.Email}></CustomText>
                        </View>
                    </View>
                    <View style={{marginTop:10}}>
                    <OrderSureBottom AdditionInfo={AdditionInfo} customerInfo={customerInfo} from={'train'} />
                    </View>
                </ScrollView>
                {this._renderFooter()}
            </LinearGradient>
        )
    }
}
const getStateProps = state => ({
    feeType: state.feeType.feeType
})

export default connect(getStateProps)(TrainOrderSureScreen);
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
