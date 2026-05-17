import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    DeviceEventEmitter,
    TouchableOpacity,
    TouchableHighlight,
    ImageBackground,
    Dimensions,
    Modal,
    Image
} from 'react-native';
import SuperView from '../../super/SuperView';
import UserInfoDao from '../../service/UserInfoDao';
import CustomText from '../../custom/CustomText';
import TrainEnum from '../../enum/TrainEnum';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Theme from '../../res/styles/Theme';
import I18nUtil from '../../util/I18nUtil';
import Util from '../../util/Util';
import Ionicons from 'react-native-vector-icons/Ionicons';
import OrderDetailInfoView from '../common/OrderDetailInfoView';
import CustomeTextInput from '../../custom/CustomTextInput';
import Key from '../../res/styles/Key';
import ViewUtil from '../../util/ViewUtil';
import TrainService from '../../service/TrainService';
import CommonService from '../../service/CommonService';
import { connect } from 'react-redux';
import StorageUtil from '../../util/StorageUtil';
import  LinearGradient from 'react-native-linear-gradient';
import {TitleView2} from '../../custom/HighLight';
import TrainlistView from './TrainlistView';
import HighLight from '../../custom/HighLight';

const screenWidth = Dimensions.get('screen').width
class TrainOrderDetailScreen extends SuperView {
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
            comment: '',
            login12306Name: null,
            passWord: null,
            login12306Data: null,
            showTrainNum: false,
            orderGrabCancel: false,
            ServiceFeesData: {},
            visible: false,
            showImageUrl: '',
            cityList:[]

        }
    }

    componentDidMount() {
        const { IsGragTicketOrder } = this.params
        this.showLoadingView();
        UserInfoDao.getCustomerInfo().then(response => {
            let orderDetailFetch;
            if (this.params.enterprise) {
                orderDetailFetch = TrainService.Enterprise_orderDetail;
            } else {
                orderDetailFetch = TrainService.orderDetail;
            }
            if (response && response.TrainAccountId) {
                this.setState({
                    login12306Name: response.TrainAccount,
                    login12306Data: response.TrainAccountId,
                })
            }
            orderDetailFetch(this.params.Id).then(orderDetail => {
                this.hideLoadingView();
                if (orderDetail && orderDetail.success) {
                    this.setState({
                        customerInfo: response,
                        order: orderDetail.data,
                        orderGrabCancel: orderDetail.data && orderDetail.data.StatusDesc == '已取消' ? true : false
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
        //服务费
        // let referencEmployeeId
        // if(this.props.comp_userInfo&&this.props.comp_userInfo.employees){
        //     let num = this.props.comp_userInfo&&this.props.comp_userInfo.employees.length-1
        //     referencEmployeeId = this.props.comp_userInfo.employees[num].PassengerOrigin.EmployeeId
        // }else{
        //     referencEmployeeId = userInfo.Id
        // }
        let model = {
            OrderCategory: 5,
            MatchModel: {
                IsGrabTicket: IsGragTicketOrder ? true : false
            },
            // ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            // ReferencePassengerId:referencEmployeeId,
        }
        CommonService.CurrentCustomerServiceFees(model).then(response => {
            if (response && response.success) {
                this.setState({
                    ServiceFeesData: response.data
                })
            }
        }).catch(error => {

        })

        this._getCity();
    }

    _getCity = () =>{
        StorageUtil.loadKeyId(Key.TrainCitysData).then(response => {//城市列表
            this.setState({
                cityList:response
            })
        })
    }


    /**
     *  同意
     * @param  order 
     */
    _agreeConfim = () => {
        const { order } = this.state;
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
        let model = { OrderId: order.Id, Status: 1 };
        this.showLoadingView();
        TrainService.approve(model).then(response => {
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
    _rejectConfim = () => {
        const { order } = this.state;
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
        TrainService.reject(model).then(response => {
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

    /**
     * 展示预订须知
     */
    _showRules = () => {
        // this.showAlertView(Util.Parse.isChinese() ? TrainEnum.trainOrderNotice.cn : TrainEnum.trainOrderNotice.en);
        const { TrainInfo } = this.state.order;
        let _alertA = Util.Parse.isChinese() ? TrainEnum.trainOrderNotice.cn : TrainEnum.trainOrderNotice.en
        let _alertB = Util.Parse.isChinese() ? TrainEnum.trainOrderNoticeGSG.cn : TrainEnum.trainOrderNoticeGSG.en
        this.showAlertView( (TrainInfo.FromStationCode==="XJA" || TrainInfo.ToStationCode==="XJA") ? _alertB : _alertA );
    }

    /**
     * 订单详情信息
     */
    _orderDetailInfo = (order) => {
        const { TrainInfo: trainInfo, OrderPassenger: passenger } = order;
        const { cityList } = this.state;
        const departureTime = Util.Date.toDate(trainInfo.DepartureTime);
        const destinationTime = Util.Date.toDate(trainInfo.ArrivalTime);
        let arrDate = new Date(destinationTime && destinationTime.toLocaleDateString());
        let depDate = new Date(departureTime && departureTime.toLocaleDateString());
        let diffTime = arrDate.getTime() - depDate.getTime();
        const diffDayCount = parseInt(diffTime / (24 * 60 * 60 * 1000));
        let runTimeDesc = trainInfo.RunTime && trainInfo.RunTime.replace(':', 'h') + ''
        let SeatInfo = passenger && passenger.SeatInfo;
        if (!Util.Parse.isChinese()) {
            SeatInfo = SeatInfo && SeatInfo.replace('车厢', 'carriages');
            SeatInfo = SeatInfo && SeatInfo.replace('座', 'seat');
        }
        cityList&&cityList.map((_item)=>{
            if(_item.Code == trainInfo.FromStationCode){
                trainInfo.FromStationEnName = _item.EnName
            }else if(_item.Code == trainInfo.ToStationCode){
                trainInfo.ToStationEnName = _item.EnName
            }
        })
        return (
            <View style={{  }}>
                <CustomText style={{color:'#fff', fontSize: 24, paddingHorizontal:30}} numberOfLines={1} text={I18nUtil.translate(order.StatusDesc)} />
                <CustomText style={{ color:'#fff', fontSize: 12, paddingHorizontal:30, marginTop:5}} text={`${I18nUtil.translate('订单号')}：${order.SerialNumber}`} />
                <View style={{backgroundColor:'#fff',marginHorizontal:10,borderRadius:6,padding:10,paddingHorizontal:20,marginTop:25,paddingTop:20}}>
                    <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                    <Text allowFontScaling={false} style={{fontSize:14}}>{destinationTime && destinationTime.format('yyyy-MM-dd')} {destinationTime && destinationTime.getWeek()}</Text>
                    <TouchableOpacity onPress={this._showRules}>
                            <CustomText style={{ color: Theme.theme, fontSize: 13 }} text='预订须知' />
                    </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', paddingVertical: 10 }}>
                        <View style={{ flex: 1, justifyContent: 'space-around' }}>
                            <Text allowFontScaling={false} style={curStyle.detailTimeFont}>{trainInfo.StartTime}</Text>
                            <CustomText style={curStyle.detailMainFont} numberOfLines={1} text={Util.Parse.isChinese()? trainInfo.FromStationName: trainInfo.FromStationEnName} />
                            {/* <Text allowFontScaling={false} style={curStyle.detailAidFont}>{departureTime && departureTime.format('MM-dd')} {departureTime && departureTime.getWeek()}</Text> */}
                        </View>
                        <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
                            <Text allowFontScaling={false} style={curStyle.detailMainFont}>{trainInfo.Checi}</Text>
                            {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}> */}
                            <Image source={require('../../res/Uimage/compDetailIcon/arrowIcon.png')} style={{width:60,height:3}}></Image>
                            {/* <Text allowFontScaling={false} style={{ fontSize:11 }}>{runTimeDesc}</Text> */}
                                <TouchableOpacity style={{flexDirection:'row', alignItems:'center'}} onPress={()=>{this._showDetail(trainInfo)}}>
                                <CustomText allowFontScaling={false} style={{ color: Theme.aidFontColor,fontSize:12 }} text={runTimeDesc} />
                                <Image style={{marginLeft:2,height:5,width:7}} source={require('../../res/Uimage/trainFloder/caret_down.png')}/>
                            </TouchableOpacity>
                            {/* </View> */}
                        </View>
                        <View style={{ flex: 1, justifyContent: 'space-around', alignItems: 'flex-end' }}>
                            <Text allowFontScaling={false} style={[curStyle.detailTimeFont, { alignItems: 'flex-end' }]}>{trainInfo.ArriveTime}</Text>
                            <CustomText style={[curStyle.detailMainFont, { alignItems: 'flex-end' }]} numberOfLines={1} text={Util.Parse.isChinese()? trainInfo.ToStationName: trainInfo.ToStationEnName} />
                            {/* <Text allowFontScaling={false} style={[curStyle.detailAidFont, { alignItems: 'flex-end' }]}>{destinationTime && destinationTime.format('MM-dd')} {destinationTime && destinationTime.getWeek()}</Text> */}
                        </View>
                        <View>
                            <Text allowFontScaling={false} style={{ fontSize: 12 }}>{diffDayCount > 0 ? '+' + diffDayCount : ''}</Text>
                        </View>
                    </View>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                    <CustomText style={{fontSize: 13,color: Theme.commonFontColor,marginRight:5 }} text={trainInfo.Zwname} />
                    {
                        // order.Status === TrainEnum.OrderStatus.TicketIssued ? 
                        <Text allowFontScaling={false} style={{ fontSize: 13}} numberOfLines={1}>{SeatInfo}</Text> //车厢座位号
                        // : null
                    }
                    {
                       order.TicketEntrance ? 
                       <Text allowFontScaling={false} style={{fontSize: 13,marginLeft:3}} numberOfLines={1}>{order.TicketEntrance}</Text> //检票口
                       : null
                    }
                    </View>
                    {this._orderInfo(order)}
                </View>
            </View>
        );
    }
    _showDetail = (ticket,index) => {
        // console.log('order===',Util.Date.toDate(ticket.DepartureTime));
        ticket.departureDate = Util.Date.toDate(ticket.DepartureTime).format('yyyy-MM-dd', true);
        this.priceView.show(ticket,{detail:true});
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
        return (
            <View style={{ backgroundColor: 'white',paddingTop:10,borderTopWidth:1,borderColor:Theme.lineColor,marginTop:10}}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>

                </View>
                {
                    order.OrderType === TrainEnum.OrderType.Reissue && order.ReissueInfo ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 13 }} text='改签原因' />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 13 }} text='：' />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 13, flex: 1 }} numberOfLines={1} text={order.ReissueInfo.ReasonDesc} />
                        </View>
                    ) : null
                }
                {
                    order.OrderType === TrainEnum.OrderType.Refund && order.RefundInfo ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 13 }} text='退票原因' />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 13 }} text='：' />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 13, flex: 1 }} numberOfLines={1} text={order.RefundInfo.ReasonDesc} />
                        </View>
                    ) : null
                }
                {
                    Comment ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <AntDesign name={'infocirlce'} size={14} color={Theme.theme} style={{ marginRight: 2 }} />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 11 }} text='驳回原因' />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 11 }} text='：' />
                            <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 11, flex: 1 }} numberOfLines={1} text={Comment.Comment} />
                        </View>
                    ) : null
                }
                {
                    order.TrainRcReason && order.TrainRcReason.Reason && order.TrainRcReason.Id ?
                        <View key={order.TrainRcReason.Id} style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                            <AntDesign name={'infocirlce'} size={14} color={Theme.theme} style={{ marginRight: 2 }} />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 11 }} text={`${I18nUtil.translate('违反差旅规定')}:  `} />
                            <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 11, flex: 1 }} numberOfLines={1} text={order.TrainRcReason.Reason} />
                        </View>
                        : null
                }
            </View>
        );
    }

    /**
    * 乘客信息
    */
    _travellerInfo(order) {
        if (!order.OrderPassenger) {
            return null;
        }
        const traveller = order.OrderPassenger;
        if (!traveller.Credentials) {
            traveller.Credentials = {
                TypeDesc: '身份证'
            }
        }
        return (
            <View style={{ backgroundColor: 'white', margin: 10, paddingVertical: 20, borderRadius:6}}>
                <View style={{ flexDirection: 'row' }}>
                    <TitleView2 title={'乘机人'}  style={{marginLeft:20}}></TitleView2>
                    <View style={{marginLeft:15,marginBottom:5}}>
                        {/* <CustomText style={{ color: Theme.annotatedFontColor }} text={traveller.Name} /> */}
                        <View style={{flexDirection:'row',alignItems:'center',justifyContentL:'center' }}>
                            <CustomText style={{ color: Theme.commonFontColor }} text={'姓名'} />
                            <CustomText style={{ color: Theme.commonFontColor }} text={'：'} />
                            <CustomText style={{ color: Theme.commonFontColor }} text={traveller.Name} />
                        </View>
                        <View style={{ flexDirection: 'row',alignItems:'center',justifyContentL:'center' }}>
                            <CustomText style={{ color: Theme.commonFontColor }} text={'证件'} />
                            {/* <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={'：' + Util.Read.simpleReplace(traveller.Certificate.SerialNumber)} /> */}
                            {/* <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={traveller.Certificate.TypeDesc} /> */}
                        </View>
                        <View style={{flexDirection:'row',alignItems:'center',justifyContentL:'center' }}>
                        <CustomText style={{ color: Theme.commonFontColor }} text={'手机'} />
                        <CustomText style={{ color: Theme.commonFontColor }} text={'：'} />
                        <CustomText style={{ color: Theme.commonFontColor, marginTop: 5 }} text={traveller.Mobile && traveller.Mobile.replace(/(\d{3})(\d{4})(\d{4})/, "$1****$3")} />
                        </View>
                        {
                            order.StatusDesc === '已出票' || order.StatusDesc === '已改签' ? 
                            <View style={{ flexDirection: 'row' }}>
                                <CustomText style={{ color: Theme.commonFontColor, marginTop: 5 }} text='票号' /><CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text='：' />
                                <CustomText style={{ color: Theme.commonFontColor, marginTop: 5 }} text={traveller.SupplierNumber} />
                            </View> : null
                        }
                        <View style={{ flexDirection: 'row' }}>
                            <CustomText style={{ color: Theme.commonFontColor, marginTop: 5 }} text={traveller.Credentials.TypeDesc} />
                            <CustomText style={{ color: Theme.commonFontColor, marginTop: 5 }} text={'：' + Util.Read.simpleReplace(traveller.Credentials.SerialNumber)} />
                        </View>
                        {order.Status === TrainEnum.OrderStatus.TicketIssued || order.Status === TrainEnum.OrderStatus.TicketReissued ? <View style={{ flexDirection: 'row' }}><CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text='取票单号' /><CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text='：' /><CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={order.OrderNumber} /></View> : null}
                        {
                            traveller.Addition && traveller.Addition.DictItemList && traveller.Addition.DictItemList.map((item) => {
                                return (
                                    item.ShowInOrder?
                                    <View style={{ flexDirection: 'row',width:240 ,flexWrap:'wrap' }}>
                                        <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={Util.Parse.isChinese() ? item.DictName : item.DictEnName ? item.DictEnName : item.DictName} />
                                        <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={'：'} />
                                        <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={Util.Parse.isChinese() ? (item.ItemName ? item.ItemName : null) : item.ItemEnName ? item.ItemEnName : (item.ItemName ? item.ItemName : null)} />
                                    </View>
                                    :null
                                )
                            })
                        }
                    </View>
                </View>

                {
                    order.Contact && (order.Contact.Name || order.Contact.Email || order.Contact.Mobile) ? (
                        <View style={{ flexDirection: 'row', marginTop: 5, borderTopWidth: 1, borderColor: Theme.lineColor , marginLeft:15}}>
                            <TitleView2 title={'联系人'}  style={{marginLeft:5,marginTop: 10}}></TitleView2>
                            <View style={{ marginTop: 5,marginLeft:15 }}>
                                {/* <View style={{ flexDirection: 'row' }}>
                                    <CustomText style={{ color: Theme.commonFontColor }} text={'姓名'} />
                                    <CustomText style={{ color: Theme.commonFontColor }} text={"："+order.Contact.Name} />
                                </View> */}
                                <View style={{ flexDirection: 'row' }}>
                                    <CustomText style={{ color: Theme.commonFontColor, marginTop: 5 }} text={'邮箱'} />
                                    <CustomText style={{ color: Theme.commonFontColor, marginTop: 5, width:220 }} text={"："+order.Contact.Email} />
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    <CustomText style={{ color: Theme.commonFontColor, marginTop: 5 }} text={'电话'} />
                                    <CustomText style={{ color: Theme.commonFontColor, marginTop: 5 }} text={"："+order?.Contact?.Mobile.replace(/(\d{3})(\d{4})(\d{4})/,"$1****$3")} />
                                </View>
                            </View>
                        </View>
                    ) : null
                }
            </View>
        );
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
     * 费用信息
     */
    _priceInfo(order) {
        const {  customerInfo, ServiceFeesData } = this.state;
        let customerSettings = customerInfo ? customerInfo.Setting : {}
        return (
            <View style={{ backgroundColor: 'white', marginHorizontal: 10, borderRadius: 6 }}>
                <View style={{ flexDirection: 'row', paddingVertical:12, borderBottomColor: Theme.lineColor, borderBottomWidth: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' , paddingHorizontal: 20}}>
                        <CustomText style={{ color: Theme.commonFontColor, fontSize: 14}} text='订单总额' />
                        {
                             ServiceFeesData  &&  ServiceFeesData.IsShowServiceCharge ? (
                                <CustomText style={{ color: Theme.fontColor }} text={'：¥' + ((order.Amount + order.ServiceCharge)?(order.Amount + order.ServiceCharge).toFixed(2):'')} />
                            ) : (
                                <CustomText style={{ color: Theme.fontColor }} text={'：¥' + (order.Amount?order.Amount.toFixed(2):'')} />
                            )
                        }
                    </View>
                </View>
                {
                    order.OrderType === TrainEnum.OrderType.Reissue && order.ReissueInfo ? (
                        <View style={{ paddingHorizontal: 20, paddingVertical:10 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='票面差' />
                                <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'¥' + order.ReissueInfo.PriceDiff} />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='改签费' />
                                <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'¥' + order.ReissueInfo.ReissueFee} />
                            </View>
                            {
                                ServiceFeesData && ServiceFeesData.IsShowServiceFee ? (
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
                                    </View>
                                ) : null
                            }
                        </View>) 
                        : 
                            <View style={{ paddingHorizontal: 20, paddingVertical:6  }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical:6 }}>
                                    <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='票面' />
                                    <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'¥' + (order.OrderType === TrainEnum.OrderType.Refund ? '-' : '') + order.Price} />
                                </View>
                                {
                                    ServiceFeesData && ServiceFeesData.IsShowServiceFee ? (
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                             <View style={{
                                                flexDirection: 'row',
                                                alignItems: "center"
                                            }}>
                                                <CustomText style={{ color: Theme.commonFontColor, fontSize: 14, paddingVertical:6 }} text='服务费' />
                                                {
                                                    order.ServiceCharge > 0 ?
                                                        <AntDesign name={'questioncircle'} color={Theme.theme} size={14} style={{ marginHorizontal: 5 }} onPress={this.showServiceInfo} />
                                                        : null
                                                }
                                            </View>
                                            {/* <CustomText style={{ color: Theme.aidFontColor, fontSize: 12 }} text='服务费' /> */}
                                            <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'¥' + order.ServiceCharge} />
                                        </View>
                                    ) : null
                                }
                                {
                                    order.OrderType === TrainEnum.OrderType.Refund && order.RefundInfo ? (
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='退票费' />
                                            <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'¥' + (order.Price - order.RefundInfo.ReturnMoney)} />
                                        </View>
                                    ) : null
                                }
                            </View>
                }
            </View >
        );
    }
    /**
     * 抢票更多车次
     */
    _moreTrainNum(order) {
        if (!order.GrabSelectTrains) {
            return null;
        }
        const { showTrainNum } = this.state;
        var checiArr = [];
        var xiweiArr = [];
        order.GrabSelectTrains.map((item) => {
            checiArr.push(item.Checi)
            xiweiArr.push(item.Zwname)
        })
        let obj = {};
        let returnCheciArr = checiArr.filter(function (item, index, arr) {
            return obj.hasOwnProperty(typeof item + JSON.stringify(item)) ? false : (obj[typeof item + JSON.stringify(item)] = true);
        });
        let obj2 = {};
        let returnXiweiArr = xiweiArr.filter(function (item, index, arr) {
            return obj2.hasOwnProperty(typeof item + JSON.stringify(item)) ? false : (obj2[typeof item + JSON.stringify(item)] = true);
        });

        return (
            <View style={{ backgroundColor: 'white', marginBottom: 10, marginHorizontal: 10, borderRadius: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomColor: Theme.lineColor, borderBottomWidth: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <CustomText style={{ color: Theme.aidFontColor }} text='抢票中其他车次' />
                    </View>
                    <TouchableOpacity
                        onPress={() => { this.setState({ showTrainNum: !this.state.showTrainNum }) }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <CustomText style={{ color: '#6DC17F', fontSize: 13 }} text={showTrainNum ? '收起' : '展开'} />
                            <Ionicons name={showTrainNum ? 'chevron-up' : 'chevron-down'} size={24} color={'#6DC17F'} style={{ marginRight: 5 }} />
                        </View>
                    </TouchableOpacity>
                </View>
                {showTrainNum ?
                    <View>
                        <View style={curStyle.bxStyle}>
                            <View style={{ flexDirection: 'row' }}>
                                <CustomText text={'备选日期'} style={{ color: Theme.darkColor }} />
                                <CustomText style={{ marginLeft: 10, color: Theme.darkColor, width: screenWidth - 90 }}
                                    text={order.GrabTrainDate} />
                            </View>
                        </View>
                        <View style={curStyle.bxStyle}>
                            <View style={{ flexDirection: 'row' }}>
                                <CustomText text={'备选车次'} style={{ color: Theme.darkColor }} />
                                <CustomText style={{ marginLeft: 10, color: Theme.darkColor }}
                                    text={returnCheciArr.join('、')} />
                            </View>
                        </View>
                        <View style={curStyle.bxStyle}>
                            <View style={{ flexDirection: 'row' }}>
                                <CustomText text={'备选席位'} style={{ color: Theme.darkColor }} />
                                <CustomText style={{ marginLeft: 10, color: Theme.darkColor, width: screenWidth - 100 }}
                                    text={returnXiweiArr.join('、')} />

                            </View>
                        </View>
                    </View> : null
                }
            </View >
        );

    }
    /**
     *  渲染审批按钮
     */
    _renderApproveBtn = (order) => {
        const { orderGrabCancel } = this.state;
        if (this.params.isApprove && order.Status === TrainEnum.OrderStatus.CheckPending) {
            return (
                <View>
                     {
                       ViewUtil.getTwoBottomBtn('驳回',this._rejectConfim,'同意',this._agreeConfim)
                     }
                </View>
            )
        } else if (order.IsGrabTicketOrder && order.Status == 24) {
            return (
                <View style={{ flexDirection: 'row', height: 60 }}>
                    {/* <TouchableHighlight style={[{ flex: 1, backgroundColor: orderGrabCancel ? 'lightgray' : Theme.theme, margin: 10, borderRadius: 30 }, { alignItems: 'center', justifyContent: 'center' }]}
                        onPress={this._cancelClick.bind(this, order)} underlayColor='transparent'>
                        <CustomText style={{ color: 'white' }} text={orderGrabCancel ? '已取消' : '取消'} />
                    </TouchableHighlight> */}
                    {
                       ViewUtil.getThemeButton(orderGrabCancel ? '已取消' : '取消',this._cancelClick.bind(this, order))
                     }
                </View>
            )
        }
    }

    /** 
   *  渲染退票改签按钮
   */
    _renderRefunRessiuseBtn = (order) => {
        if (this.params.isApprove) return;
        var timeline = true;//true可以改签 
        var dateX = order.TrainInfo.DepartureTime.replace(/T/g, ' ').replace(/.[\d]{3}Z/, ' ')//发车时间
        let date3 = new Date()//当前日期
        //发车一个月后
        var mouth_cha = Util.Date.toDate(dateX).getTime() + 30 * 24 * 3600 * 1000 - Util.Date.toDate(date3).getTime()
        // let now = new Date().toLocaleDateString();//当前日期
        let now = new Date().toLocaleDateString();//当前日期
        let dateTime = new Date(order.TrainInfo.TrainDate).toLocaleDateString()//发车日期 
        var cha = Util.Date.toDate(dateX).getTime() - Util.Date.toDate(date3).getTime()//发车时间减去当前时间
        var chaMinuse = (cha / (1000 * 60));
        if (cha < 0) {//超出发车时间
            if (now == dateTime) {//判断发车是当前日期
                if ((date3.getHours() * 60 + date3.getMinutes()) < (23 * 60 + 20)) {//判断已发车并且在23：20前还可以退票                   
                    timeline = true
                } else {
                    timeline = false
                }
            } else {
                timeline = false
            }
        }

        if (order.Status === TrainEnum.OrderStatus.TicketIssued) {
            return (
                <View style={{ flexDirection: 'row', height: 60,backgroundColor:'#fff' }}>
                    {/* order.TrainIsOutage?'gray': Theme.themeg2 */}
                    {
                        order.OrderType === TrainEnum.OrderType.Issued ?
                            <TouchableHighlight style={[{ flex: 1, backgroundColor:(order.TrainIsOutage||!timeline||( order.ordertype==2 && (order.ReissueInfo&&order.ReissueInfo.IsAfterDepartureChange==true))) ? 'lightgray' : '#fff', margin: 10, borderRadius: 2,borderWidth:1,borderColor:(order.TrainIsOutage||!timeline||( order.ordertype==2 && (order.ReissueInfo&&order.ReissueInfo.IsAfterDepartureChange==true))) ? 'lightgray' : '#fff' }, { alignItems: 'center', justifyContent: 'center' }]} 
                                   onPress={this._orderReschedule.bind(this, order,timeline)} underlayColor='transparent'>
                                <CustomText style={{ color: (order.TrainIsOutage||!timeline||( order.ordertype==2 && (order.ReissueInfo&&order.ReissueInfo.IsAfterDepartureChange==true))) ? '#fff' : Theme.theme}} 
                                            text='改签' 
                                />
                            </TouchableHighlight> : null
                    }
                    {order.Status === TrainEnum.OrderStatus.TicketIssued ?
                    <TouchableHighlight style={[{ flex: 1, backgroundColor: (order.TrainIsOutage && mouth_cha < 0) || (!order.TrainIsOutage && (chaMinuse < 10)) || (order.ReissueInfo&&order.ReissueInfo.IsAfterDepartureChange) ? 'lightgray' : Theme.theme, margin: 10, borderRadius: 2 }, { alignItems: 'center', justifyContent: 'center' }]} 
                                        onPress={this._orderRefund.bind(this, order, mouth_cha, chaMinuse)} underlayColor='transparent'>
                        <CustomText style={{ color: 'white' }} text='退票' />
                    </TouchableHighlight>:null}
                </View>
            )
        }
    }

    _orderReschedule = (order,timeline) => {
        if (order.TrainIsOutage|| !timeline || (order.ordertype==2&&(order.ReissueInfo&&order.ReissueInfo.IsAfterDepartureChange==true))) {
            this.toastMsg('此次行程已停运，不能改签');
        }else{
            this.push('TrainChangeIndex', { order: order });
        }
    }

    _orderRefund = (order, mouth_cha, chaMinuse) => {
        if (order.TrainIsOutage) {
            if (mouth_cha < 0) {
                this.toastMsg('已超过退票期限，不能退票');
            } else {
                this.push('TrainOrderRefundScreen', { order });
            }
        }else{
            if(order.ReissueInfo && !order.ReissueInfo.IsAfterDepartureChange){
                this.toastMsg('发车后改签的订单无法提交退票')
                }else if(chaMinuse > 10){
                    this.push('TrainOrderRefundScreen', { order });
                }else{if(chaMinuse < 0){
                    this.toastMsg('已过发车时间，不能提交退票');
                }else{
                    this.toastMsg('距离发车时间较短，不能提交退票');
                }
            }
        }
    }

        _cancelClick = (order) => {
            let model = {
                OrderId: this.params.Id
            }
            this.showAlertView('确认要取消抢票订单吗？', () => {
                return ViewUtil.getAlertButton('取消', () => {
                    this.dismissAlertView();
                }, '确定', () => {
                    this.dismissAlertView();
                    TrainService.TrainOrderGrabCancel(model).then(response => {
                        this.hideLoadingView();
                        if (response && response.success) {
                            this.setState({
                                orderGrabCancel: true
                            })
                            this.toastMsg('取消成功');
                        } else {
                            this.toastMsg(response.message || '取消抢票单失败');
                        }
                    }).catch(error => {
                        this.hideLoadingView();
                        this.toastMsg(error.message || '取消抢票单失败');
                    })
                })
            })
        }
        /**
         * 关联12306
         */
        _relate12306login = (order) => {
            const { login12306Name, login12306Data } = this.state;
            return (
                <View style={curStyle.viewStyle}>  
                <View style={{flexDirection:'row',alignItems:'center'}}>
                    <ImageBackground style={{width:38,height:38}} source={require('../../res/Uimage/trainFloder/train12306.png')}/>
                        {order.ApplyLoginStatus == 1 ? <CustomText style={{ fontSize: 14, marginLeft: 10 }} text={order.TrainAccount && order.TrainAccount.trainAccount} /> :
                            login12306Name ? <CustomText style={{ fontSize: 14, marginLeft: 10 }} text={login12306Name} /> :
                                <View style={{ width: 230, marginLeft: 10 }}>
                                    <CustomText style={{ fontSize: 14, fontWeight: 'bold' }} text='铁路局规定购票必须实名制' />
                                    <CustomText style={{ marginTop: 5, fontSize: 14 }} text='登录12306账号提高出票成功率' />
                                </View>
                        }
                    </View>
                    <TouchableOpacity onPress={() => { this._relateClick(order) }}
                        style={{ right: 10, width: 63, height: 30, backgroundColor: Theme.theme, borderRadius: 4, justifyContent: 'center', alignItems: 'center' }}>
                        <CustomText style={{ fontSize:14,color:'#fff' }}
                            text={(
                                order.ApplyLoginStatus === 1 && login12306Data) ?
                                '已关联' :
                                login12306Name ?
                                    `${I18nUtil.translate('关联中')}...` :
                                    '关联'} />
                    </TouchableOpacity>
                </View>)
        }
        _relateClick = (order) => {
            const { login12306Name, passWord } = this.state;
            order.ApplyLoginStatus == 1 || login12306Name ?
                null
                :
                order.ApplyLoginStatus == 2 ?
                    this.push('TrainRelateScreen', {
                        code: 2, orderNum: order.SerialNumber, callBack: (name, passWord, data) => {
                            this.setState({
                                login12306Name: name,
                                passWord: passWord,
                                login12306Data: data
                            })
                        }
                    }) :
                    this.push('TrainRelateScreen', {
                        orderNum: order.SerialNumber, callBack: (name, passWord, data) => {
                            this.setState({
                                login12306Name: name,
                                passWord: passWord,
                                login12306Data: data
                            })
                        }
                    })
        }
        _LeftTitleBtn = () => {
            this.pop();     
        }
        renderBody() {
            const { order, customerInfo, login12306Name, login12306Data } = this.state;
            const { isShowBtn } = this.params;
            if (!order) return;
            return (
                <View style={{flex:1}}>
                <LinearGradient start={{x: 1, y: 0}} end={{x: 1, y: 0.5}} style={{flex:1}} colors={[Theme.theme,Theme.normalBg]}>
                    {/* <View style={{flexDirection:'row',paddingHorizontal:15,justifyContent:'space-between',height:44,alignItems:'center'}}>
                        <TouchableOpacity onPress={()=>{this._LeftTitleBtn()}}>
                            <AntDesign name={'arrowleft'} size={20} color={'#fff'} />
                        </TouchableOpacity>
                        <CustomText style={{fontSize:16, color:'#fff'}} text={'订单详情'}></CustomText>
                        <CustomText style={{fontSize:16, color:'#fff'}} text={''}></CustomText>
                    </View> */}
                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps='handled'>
                        {this._orderDetailInfo(order)}
                        {
                          customerInfo&&customerInfo.Addition&&customerInfo.Addition.HasTrainAuth?
                            order.EmployeeTrainAccountId > 0 ? (//判断是否配置显示12306
                                this.params.enterprise ? null :
                                    (login12306Data > 0 && login12306Name) ?
                                        this._relate12306login(order) : null
                            ) : null
                          :null
                        }
                        {this._travellerInfo(order)}
                        {this._priceInfo(order)}
                        {this._moreTrainNum(order)}
                        {/* <OrderDetailInfoView order={order} customerInfo={customerInfo} _this={this} /> */}
                        <OrderDetailInfoView order={order} otwThis={this} customerInfo={customerInfo} showImage={(url) => {
                            this.setState({
                                showImageUrl: url,
                                visible: true
                            })
                        }} />
                        {this._renderShowBigImage()}
                        {/* {isShowBtn?this._renderRefunRessiuseBtn(order):null} */}
                    </ScrollView>
                    <TrainlistView ref={o => this.priceView = o} />
                </LinearGradient>
                {
                      this._renderApproveBtn(order)
                }
                { isShowBtn? this._renderRefunRessiuseBtn(order):null }
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
                            <Image style={{width: screenWidth-20, height: screenHeight-20, resizeMode:'contain' }} source={{ uri: this.state.showImageUrl }} />
                        </View>
                    </TouchableHighlight>
                </Modal>
            )
        }
    }

    const curStyle = StyleSheet.create({
        detailMainFont: {
            fontSize: 12,
            marginTop:5
           
        },
        detailAidFont: {
          
            fontSize: 18,
            marginTop: 10
        },
        detailSeatFont: {
           
            fontSize: 13,
            marginRight: 10,
        },
        detailTimeFont: {
            color: '#333',
            fontSize: 24,
            fontWeight:'bold'
        },
        mainFont: {
            color: Theme.mai
        },
        aidFont: {
        },
        underLine: {
            borderBottomColor: Theme.lineColor,
            borderBottomWidth: 1
        },
        center: {
            alignItems: 'center',
            justifyContent: 'center'
        },
        bxStyle: {
            height: 44,
            paddingHorizontal: 10,
            flexDirection: "row",
            justifyContent: 'space-between',
            alignItems: "center",
            marginBottom: 1
        },
        viewStyle:{
            flexDirection:'row',
            justifyContent:'space-between',
            alignItems:'center',
            padding:10,
            alignContent:'center',
            backgroundColor:'#fff',
            marginHorizontal:10,
            borderRadius:6,
            marginTop:10
        },
    })

    const getStatusProps = state => ({
        comp_userInfo: state.comp_userInfo,
    })
    export default connect(getStatusProps)(TrainOrderDetailScreen);