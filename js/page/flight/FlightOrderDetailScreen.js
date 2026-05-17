import React from 'react';
import {
    View,
    ScrollView,
    DeviceEventEmitter,
    TouchableOpacity,
    TouchableHighlight,
    Modal,
    Image,
    StyleSheet,
    Text
} from 'react-native';
import SuperView from '../../super/SuperView';
import DetailHeaderView from './DetailHeaderView';
import UserInfoDao from '../../service/UserInfoDao';
import FlightService from '../../service/FlightService';
import CustomText from '../../custom/CustomText';
import FlightEnum from '../../enum/FlightEnum';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Theme from '../../res/styles/Theme';
import I18nUtil from '../../util/I18nUtil';
import Util from '../../util/Util';
import OrderDetailInfoView from '../common/OrderDetailInfoView';
import RuleView from './RuleView';
import RuleView2 from './RuleView2';
import CustomeTextInput from '../../custom/CustomTextInput';
import Key from '../../res/styles/Key';
import ViewUtil from '../../util/ViewUtil';
import Pop from 'rn-global-modal';
import { connect } from 'react-redux';
import CommonService from '../../service/CommonService';
import  LinearGradient from 'react-native-linear-gradient';
import {TitleView,TitleView2} from '../../custom/HighLight';
import BackPress from '../../common/BackPress';
import HighLight from '../../custom/HighLight';

class FlightOrderDetailScreen extends SuperView {
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
            bottomInset: true,
        }
        this.state = {
            customerInfo: null,
            order: null,
            showPrice: true,
            comment: '',
            IsShowServiceFee: true,
            visible: false,
            showImageUrl: ''
        }
        this.backPress = new BackPress({ backPress: () => this._backBtnClick() })
    }
    _backBtnClick = () => {
        this.pop();
        return true;
    }

    componentDidMount() {
        this.backPress.componentDidMount();
        this.showLoadingView();
        UserInfoDao.getCustomerInfo(this.props.comp_userInfo&&this.props.comp_userInfo.IdModel).then(response => {
            let detailFetch = FlightService.orderDetail
            if (this.params.index && this.params.index == 2) {
                detailFetch = FlightService.Enterprise_orderDetail
            }
            detailFetch(this.params.Id).then(orderDetail => {
                this.hideLoadingView();
                if (orderDetail && orderDetail.success) {
                    this.setState({
                        customerInfo: response,
                        order: orderDetail.data
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
        let model = {
            OrderCategory: 1,
            MatchModel: null,
        }
        CommonService.CurrentCustomerServiceFees(model).then(response => {
            if (response && response.success) {
                this.setState({
                    IsShowServiceFee: response.data.IsShowServiceFee
                })
            }
        }).catch(error => {

        })

    }

    //国内机票校验是否值机
    _ValidateTicket1 = () => {
        const {  Id } = this.params;
        const { order } = this.state;
        let model = {
            OrderId: order?.Id ? order.Id : Id?Id:'',
            Type:2 //2改期 3退票
        }
        this.showLoadingView();
        FlightService.FltOrderValidateTicketStatus(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                  this._orderReschedule()
            } else {
                this.toastMsg(response.message);
            }
        }).catch(error => {
            this.hideLoadingView();
            this._orderReschedule()
            // otwThis.toastMsg(error.message || '数据异常');
        })  
    }

    //国内机票校验是否值机
    _ValidateTicket2 = () => {
        const {  Id } = this.params;
        const { order } = this.state;
        let model = {
            OrderId: order?.Id ? order.Id : Id?Id:'',
            Type:3 //2改期 3退票
        }
        this.showLoadingView();
        FlightService.FltOrderValidateTicketStatus(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                this._orderRefund()
            } else {
                this.toastMsg(response.message);
            }
        }).catch(error => {
            this.hideLoadingView();
            this._orderRefund()
            // otwThis.toastMsg(error.message || '数据异常');
        })  
    }

    /**
     *  改签
     */
    _orderReschedule = () => {
        const {order} = this.state;
        if(!order){return}
        FlightService.orderDetail(order.Id).then(orderDetail => {
            if (orderDetail && orderDetail.success) {
                this.push('FlightChangeSearch', {order:order, oldOrderDetail:orderDetail.data});
            } else {
                this.toastMsg(orderDetail.message || '获取信息异常');
            }
        }).catch(error => {
            this.toastMsg(error.message || '获取信息异常');
        })    
    }
    /**
     *  退票
     */
    _orderRefund = () => {
        const {order} = this.state
        if(!order){return}
        this.push('FlightOrderRefund', {
            Id: order.Id
        });
    }

    /**
     *  同意
     * @param  order 
     */
    _agreeConfim = () => {
        const {order} = this.state
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
        const {comment} = this.state
        let model = { OrderId: order.Id, Status: 1, Comment: comment,};
        this.showLoadingView();
        FlightService.approve(model).then(response => {
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
        const { order } = this.state
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
        FlightService.approve(model).then(response => {
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

    _showInsurece = (obj) => {
        if (obj && obj.CustomerInsuranceJson) {
            let insurance = JSON.parse(obj.CustomerInsuranceJson);
            if (insurance && insurance.InsuranceDetail && insurance.InsuranceDetail.length > 0) {
                this.showAlertView(
                    Util.Parse.isChinese() ? insurance.InsuranceDetail[0].InsuranceDesc  : insurance.InsuranceDetail[0].InsuranceEnDesc ? insurance.InsuranceDetail[0].InsuranceEnDesc : insurance.InsuranceDetail[0].InsuranceDesc
                );
            }
        }
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
            <View style={{ backgroundColor: 'white', padding: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>

                    <View style={{ flexDirection: 'row', flex: 1 }}>
                        <CustomText style={{ fontSize: 15 }} text='订单状态' />
                        <CustomText style={{ fontSize: 15 }} text='：' />
                        <CustomText style={{ color: Theme.specialColor2, fontSize: 15, flex: 1 }} numberOfLines={1} text={I18nUtil.translate(order.StatusDesc)} />
                    </View>
                    <View style={{ flexDirection: 'row', flex: 1, marginLeft: 5 }}>
                        <CustomText style={{ color: Theme.aidFontColor, fontSize: 15, flex: 1 }} text={`${I18nUtil.translate('订单号')}：${order.SerialNumber}`} />
                    </View>

                </View>
                {
                    order.OrderType === FlightEnum.OrderType.Reissue && order.ReissueInfo ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 12 }} text='改签原因' />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 12 }} text='：' />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 12, flex: 1 }} numberOfLines={1} text={order.ReissueInfo.ReasonDesc} />
                        </View>
                    ) : null
                }
                {
                    order.OrderType === FlightEnum.OrderType.Refund && order.RefundInfo ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 12 }} text='退票原因' />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 12 }} text='：' />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 12, flex: 1 }} numberOfLines={1} text={order.RefundInfo.ReasonDesc} />
                        </View>
                    ) : null
                }
                {
                    Comment ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <AntDesign name={'infocirlce'} size={16} color={Theme.theme} style={{ marginRight: 2 }} />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 10 }} text='驳回原因' />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 10 }} text='：' />
                            <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 10, flex: 1 }} numberOfLines={1} text={Comment.Comment} />
                        </View>
                    ) : null
                }
                {
                    Array.isArray(order.RcReasonLst) && order.RcReasonLst.length > 0 ?
                        this._ruleReasonShow(order.RcReasonLst) : null
                }
            </View>
        );
    }
    _ruleReasonShow = (list) => {
        let arr = [];
        for (let i = 0; i < list.length; i++) {
            let obj = list[i];
            if (obj.Reason && obj.RuleType == 1) {
                obj.Reason = obj.Reason.replace(' ', '');
                arr.push(
                    <View key={i} style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                        <AntDesign name={'infocirlce'} size={16} color={Theme.theme} style={{ marginRight: 2 }} />
                        <CustomText style={{ color: Theme.specialColor2, fontSize: 10 }} text='违反最低价规则原因：' />
                        <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 10, flex: 1 }} numberOfLines={1} text={Util.Parse.isChinese() ? obj.Reason : obj.ReasonEn} />
                    </View>
                )
            }
            if (obj.Reason && obj.RuleType == 2) {
                obj.Reason = obj.Reason.replace(' ', '');
                arr.push(
                    <View key={i} style={{ flexDirection: 'row', marginTop: 5, flex: 1, alignItems: 'center' }}>
                        <AntDesign name={'infocirlce'} size={16} color={Theme.theme} style={{ marginRight: 2 }} />
                        <CustomText style={{ color: Theme.specialColor2, fontSize: 10 }} text='违反提前预定规则原因：' />
                        <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 10, flex: 1 }} numberOfLines={1} text={Util.Parse.isChinese() ? obj.Reason : obj.ReasonEn} />
                    </View>
                )
            }
            if (obj.Reason && obj.RuleType == 7) {
                obj.Reason = obj.Reason.replace(' ', '');
                arr.push(
                    <View key={i} style={{ flexDirection: 'row', marginTop: 5, flex: 1, alignItems: 'center' }}>
                        <AntDesign name={'infocirlce'} size={16} color={Theme.theme} style={{ marginRight: 2 }} />
                        <CustomText style={{ color: Theme.specialColor2, fontSize: 10 }} text='违反指定折扣的原因：' />
                        <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 10, flex: 1 }} numberOfLines={1} text={Util.Parse.isChinese() ? obj.Reason : obj.ReasonEn} />
                    </View>
                )
            }
        }
        return (
            <View>
                {arr}
            </View>
        )
    }
    /**
    * 乘客信息
    */
    _travellerInfo(order) {
        if (!order.Travellers || order.Travellers.length == 0) {
            return null;
        }
        const traveller = order.Travellers[0];
        if (!traveller.Certificate) {
            traveller.Certificate = {
                TypeDesc: '身份证'
            }
        }

        return (
            <View style={{ backgroundColor: 'white', marginBottom: 10, paddingVertical: 20 }}>
                {this._insurances(order)}
                
                <View style={{ flexDirection: 'row' }}>
                   <TitleView2 title={'乘机人'}  style={{}}></TitleView2>
                    <View style={{ marginLeft:15}}>
                        <View style={{flexDirection:'row',alignItems:'center',justifyContentL:'center' }}>
                            <CustomText style={{ color: Theme.commonFontColor }} text={'姓名'} />
                            <CustomText style={{ color: Theme.annotatedFontColor }} text={'：'} />
                            <CustomText style={{ color: Theme.annotatedFontColor }} text={traveller.Name} />
                        </View>
                        <View style={{ flexDirection: 'row',alignItems:'center',justifyContentL:'center' }}>
                            <CustomText style={{ color: Theme.annotatedFontColor }} text={'证件'} />
                            <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={'：' + Util.Read.simpleReplace(traveller.Certificate.SerialNumber)} />
                            <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={traveller.Certificate.TypeDesc} />
                        </View>
                        <View style={{flexDirection:'row',alignItems:'center',justifyContentL:'center' }}>
                        <CustomText style={{ color: Theme.annotatedFontColor }} text={'手机号'} />
                        <CustomText style={{ color: Theme.annotatedFontColor }} text={'：'} />
                        <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={traveller.Mobile && traveller.Mobile.replace(/(\d{3})(\d{4})(\d{4})/, "$1****$3")} />
                        </View>
                        {order.StatusDesc === '已出票' || order.StatusDesc === '已改签' ? 
                            <View style={{ flexDirection: 'row' }}>
                                <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text='票号' /><CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text='：' />
                                <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={traveller.SupplierNumber} />
                            </View> : null}
                        {/* {
                            order.AdditionInfo && order.AdditionInfo.DictItemList && order.AdditionInfo.DictItemList.map((item) => {
                                return (
                                    <View style={{ flexDirection: 'row' }}>
                                        <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={Util.Parse.isChinese() ? item.DictName : item.DictEnName ? item.DictEnName : item.DictName} />
                                        <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={'：'} />
                                        <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={Util.Parse.isChinese() ? item.ItemName : item.ItemEnName ? item.ItemEnName : item.ItemName} />
                                    </View>
                                )
                            })
                        } */}
                        {
                            traveller.Addition && traveller.Addition.DictItemList && traveller.Addition.DictItemList.map((item) => {
                                return (
                                    item.ShowInOrder?
                                    <View style={{ flexDirection:'row',width:240 ,flexWrap:'wrap'}}>
                                        <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={Util.Parse.isChinese() ? item.DictName : item.DictEnName ? item.DictEnName : item.DictName} />
                                        <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={'：'} />
                                        <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={Util.Parse.isChinese() ? item.ItemName : item.ItemEnName ? item.ItemEnName : item.ItemName} />
                                    </View>
                                    :null
                                )
                            })
                        }
                    </View>
                </View>
                
                {
                    order.Contact && (order.Contact.Name || order.Contact.Email || order.Contact.Mobile) ? (
                        <View style={{ flexDirection: 'row', marginTop: 5, borderTopWidth: 1, borderColor: Theme.lineColor }}>
                            <TitleView2 title={'联系人'}  style={{marginTop: 20,}}></TitleView2>
                            <View style={{ marginLeft:15,marginTop: 15, }}>
                                {/* <View style={{ flexDirection: 'row' }}>
                                    <CustomText style={{ color: Theme.annotatedFontColor }} text={'姓名'} />
                                    <CustomText style={{ color: Theme.annotatedFontColor }} text={"："+order.Contact.Name} />
                                </View> */}
                                <View style={{ flexDirection: 'row' }}>
                                    <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={'邮箱'} />
                                    <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5,width:220 }} text={"："+order.Contact.Email} />
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={'电话'} />
                                    <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={"："+order.Contact.Mobile} />
                                </View>
                            </View>
                        </View>
                    ) : null
                }
                
            </View>
        );
    }
    /**
    * 是否为最低价
    */
    _lowPticeInfo(order) {
        if(!order){ return };
        var d = new Date(Util.Date.toDate(order.TicketDraftLimit))
        // var datetime = d.format('yyyy-MM-dd HH:mm:ss');
        let lowestFlight;
        let ruleType;
        let lowRuleType;
        order.RcReasonLst&&order.RcReasonLst.map((item)=>{
            if( item.LowestFlight ){
                lowestFlight = item.LowestFlight
            }
            if(item.RuleType === 17){
                ruleType = true
            }
            if(item.RuleType === 1){
                lowRuleType = true
            }
        })
        let priceCha;
        if(lowestFlight && order.OrderAir&&order.OrderAir.Price){
            priceCha = order.OrderAir.Price - lowestFlight.Price
        }else{
            priceCha = 0
        }
        return (
            <View style={{ backgroundColor: 'white'}}>
                { lowestFlight?
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ flex: 3 }}>
                            <CustomText style={{ color: Theme.commonFontColor ,fontSize:14}} text='是否为最低价' />
                        </View>
                        <View style={{ flex: 8 }}>
                            <CustomText style={{ color: Theme.fontColor ,textAlign: 'right'}} text={'否'} />
                            {
                                lowestFlight.DepartureTime === '0001-01-01T00:00:00' || !lowestFlight.DepartureTime ? null
                                :
                                <View style={{ flexDirection: "row-reverse" }}>
                                    <CustomText style={{ color: Theme.fontColor, marginLeft:5 ,fontSize:14}} 
                                        text={lowestFlight.DepartureTime.replace("T"," ")} 
                                    />
                                    <CustomText style={{ color: Theme.fontColor,fontSize:14,textAlign: 'right' }} 
                                        text={'附近时段'} 
                                    />
                                </View>
                            }                            
                            {lowestFlight.AirlineName? <CustomText style={{ color: Theme.commonFontColor ,fontSize:14,textAlign: 'right'}} 
                                text={lowestFlight.AirlineName +" "+ lowestFlight.Airline + lowestFlight.AirNumber} 
                            />:null}
                             <View style={{ flexDirection: "row-reverse" }}>
                                <CustomText style={{ color: Theme.fontColor, marginLeft:5,fontSize:14}} 
                                    text={lowestFlight.Discount} 
                                />
                                <CustomText style={{ color:Theme.fontColor ,fontSize:14}} 
                                    text={"折扣"} 
                                />
                            </View>
                            <View style={{ flexDirection: "row-reverse"  }}>
                                <CustomText style={{ color: Theme.fontColor, marginLeft:5 ,fontSize:14}} 
                                    text={'¥'+lowestFlight.Price} 
                                /> 
                                <CustomText style={{ color:Theme.fontColor,fontSize:14 }} 
                                    text={"价格"} 
                                />
                             </View>
                        </View>
                    </View>:
                    ruleType?null:
                    lowRuleType?
                        <View style={{ flexDirection: 'row',justifyContent:'space-between',paddingVertical:5 }}>
                            <View style={{ flex: 3 }}>
                                <CustomText style={{ color: Theme.commonFontColor,fontSize:14 }} text='是否为最低价' />
                            </View>
                            <View style={{ flex: 8 }}>
                                <CustomText style={{ color: Theme.fontColor,fontSize:14 }} text={'否'} />
                            </View>
                        </View>:
                        <View style={{ flexDirection: 'row',justifyContent:'space-between' ,paddingVertical:5}}>
                            <View style={{  }}>
                                <CustomText style={{ color: Theme.commonFontColor,fontSize:14 }} text='是否为最低价' />
                            </View>
                            <View style={{}}>
                                <CustomText style={{ color: Theme.fontColor,fontSize:14 }} text={'是'} />
                            </View>
                        </View>
                }
                <View style={{ }}>
                    <View style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:5 }}>
                        <CustomText style={{ color: Theme.commonFontColor,fontSize:14 }} text='是否违背差旅政策' />
                        {
                            order?.RcReasonLst?.[0]?.RuleType === 17 ? (
                                <View style={{}}>
                                    <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'否'} />
                                </View>
                            ) : (
                                <View style={{}}>
                                    <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'是'} />
                                </View>
                            )
                        }
                    </View>
                    {
                        order?.RcReasonLst?.[0]?.RuleType === 17?
                            <View style={{paddingVertical:5}}>
                                <View style={{ flexDirection: 'row',justifyContent:'space-between' }}>
                                    <CustomText style={{ color: Theme.commonFontColor, marginLeft:0,fontSize:14 }}
                                        text={'原因'}
                                    />
                                    <CustomText style={{ color: Theme.fontColor, marginLeft:0,fontSize:14 }}
                                        text={Util.Parse.isChinese()? order.RcReasonLst[0].Reason:order.RcReasonLst[0].EnReason}
                                    /> 
                                </View>
                            </View>
                            :
                            <View style={{paddingVertical:5}}>
                                {order.RcReasonLst&&order.RcReasonLst.map((item)=>{
                                return(
                                    <View style={{}}>
                                        <View style={{ flexDirection: 'row',justifyContent:'space-between',paddingVertical:5 }}>
                                            <CustomText style={{ color: Theme.commonFontColor,fontSize:14}}
                                                text={'违反'}
                                            />
                                            <CustomText style={{ color: Theme.fontColor, marginLeft:5,fontSize:14 }}
                                                text={Util.Parse.isChinese()?item.RuleTypeDesc:item.RuleTypeDescEn}
                                            />
                                        </View>
                                        <View style={{ flexDirection: 'row-reverse',justifyContent:'space-between',paddingVertical:5 }}>
                                            <CustomText style={{ color: Theme.fontColor,fontSize:14,width:240,textAlign: 'right'}}
                                                text={Util.Parse.isChinese()?item.Reason:item.ReasonEn}
                                            />
                                            <CustomText style={{ color: Theme.commonFontColor ,fontSize:14}}
                                                text={'原因'}
                                            />
                                        </View>
                                    </View>
                                )}) 
                               } 
                            </View>
                    }
                </View>
               { 
                  lowestFlight?
                    <View>
                        <View style={{ flexDirection: 'row', justifyContent:'space-between' }}>
                            <View style={{ }}>
                                <CustomText style={{ color: Theme.commonFontColor,fontSize:14,paddingVertical:5 }} text='是否错失节约成本' />
                            </View>
                                <View style={{ }}>
                                    <View >
                                        <CustomText style={{ color: Theme.fontColor ,fontSize:14,paddingVertical:5}} text='是' />
                                    </View>
                                </View>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent:'space-between' }}>
                            <CustomText style={{ color: Theme.commonFontColor ,fontSize:14,paddingVertical:5}} text={Util.Parse.isChinese()?"当前最低价航班为":"The cheapest flight is"} />
                            <CustomText style={{ color: Theme.fontColor,fontSize:14,paddingVertical:5 }}text={lowestFlight.Price}/>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent:'space-between' }}>
                            <CustomText style={{ color: Theme.commonFontColor ,fontSize:14,paddingVertical:5}} text={Util.Parse.isChinese()?'错失节约成本': "Lost savings"}/>
                            <CustomText style={{ color: Theme.fontColor,fontSize:14,paddingVertical:5 }}text={priceCha}/>
                        </View>
                    </View>
                  :null
               }
            </View>
        );
    }
     /**
    * 乘息
    */
    _tInfo(order) {
        var d = new Date(Util.Date.toDate(order.TicketDraftLimit))
        var datetime = d.format('yyyy-MM-dd HH:mm:ss');
        return (
            <View style={{ }}>
                <View style={{ flexDirection: 'row',justifyContent:'space-between',paddingVertical:5 }}>
                    <View style={{ }}>
                        <CustomText style={{ color: Theme.commonFontColor,fontSize:14 }} text='PNR' />
                    </View>
                    <View style={{ }}>
                        <CustomText style={{ color: Theme.fontColor ,fontSize:14}} text={order.PnrCode} />
                    </View>
                </View>
                <View style={{ flexDirection: 'row',justifyContent:'space-between',paddingVertical:5 }}>
                    <View style={{ }}>
                        <CustomText style={{ color: Theme.commonFontColor,fontSize:14 }} text='出票时限' />
                    </View>
                    <View style={{  }}>
                        <CustomText style={{ color: Theme.fontColor ,fontSize:14}}
                            text={datetime}
                        />
                    </View>
                </View>
            </View>
        );
    }

    /** 
     * 保险信息
     */
    _insurances(order) {
        if (!order) return null;
        if (order.Travellers && order.Travellers.length > 0) {
            const insurance = [];
            order.Travellers.forEach(item => {
                if (item.Insurances && item.Insurances.length > 0) {
                    item.Insurances.forEach(ins => {
                        const obj = insurance.find(fi => fi.Id === ins.Id && fi.Status === ins.Status);
                        if (obj) {
                            if (obj.insuranceCount) {
                                obj.insuranceCount++;
                            }
                        } else {
                            ins.insuranceCount = 1;
                            insurance.push(ins);
                        }
                    })
                }
            })
            const componetList = [];
            insurance.forEach((insuran, index) => {
                componetList.push(
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,flexWrap:'wrap' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center',flexWrap:'wrap' }}>
                            <Text>
                            <CustomText text={Util.Parse.isChinese()? insuran.ProductName:insuran.ProductEnName?insuran.ProductEnName:insuran.ProductName} style={{ color: Theme.annotatedFontColor ,fontSize:13,paddingVertical:5}} />
                            <AntDesign name={'questioncircle'} color={Theme.theme} size={18} style={{ marginHorizontal: 5 }} onPress={this._showInsurece.bind(this, insuran)} />
                            <CustomText text={insuran.PurchasePrice+'X' + insuran.insuranceCount} style={{ color: Theme.annotatedFontColor,fontSize:13 }} />
                            </Text>
                        </View>
                        <CustomText text={insuran.StatusDesc} style={{ color: Theme.annotatedFontColor }} />
                    </View>
                )
            })
            if (componetList.length == 0) return null;
            return (
                <View style={{ }}>
                    <View style={{flexDirection:'row'}}>
                    <AntDesign name={'Safety'} size={16} color={Theme.theme} style={{ marginRight: 5 }} />
                    <CustomText text='保险信息' style={{ fontSize:14 }} />
                    </View>
                    <View style={{ }}>
                        {componetList}
                    </View>
                    <View style={{height:1,backgroundColor:Theme.themeLine,paddingHorizontal:20,marginBottom:20}}></View>
                </View>
            )

        } else {
            return null;
        }
    }

    _alert = (obj) => {
        Pop.show(
            <View style={{
                width: '80%',
                backgroundColor: '#fff',
                borderRadius: 8,
                padding: 20,
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <CustomText text={obj} />
            </View>,
            { animationType: 'fade', maskClosable: true, onMaskClose: () => { } }
        )
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
        const { showPrice, customerInfo, IsShowServiceFee } = this.state;
        let customerSettings = customerInfo ? customerInfo.Setting : {}
        let bindProduct = [];
        if (order.SupplierType === 3 && order.OrderAir && order.OrderAir.BindProductInfo) {
            for (let i = 0; i < order.OrderAir.BindProductInfo.length; i++) {
                let obj = order.OrderAir.BindProductInfo[i];
                bindProduct.push(
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <CustomText style={{ color: Theme.aidFontColor, fontSize: 12 }} text={obj.subProdName} />
                        <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 12 }} text={'¥' + obj.subProdPrice} />
                    </View>
                )
            }
        }
        let productCabins = order.OrderAir && order.OrderAir.ProductCabins;
        return (
            <View style={{ backgroundColor: '#fff',marginBottom:25}}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomColor: Theme.themeLine, borderBottomWidth: 1,paddingBottom:15 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TitleView2 title={'订单总额'} style={{}}></TitleView2>
                        {
                            IsShowServiceFee ? (
                                <CustomText style={{ color: Theme.fontColor , fontSize: 14}} text={'：¥' + (order.Amount + order.ServiceCharge).toFixed(2)} />
                            ) : (
                                <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'：¥' + order.Amount} />
                            )
                        }
                        {
                            order.Status === FlightEnum.OrderStatus.TicketRefunding ? (
                                <TouchableOpacity style={{ marginLeft: 5 }} onPress={() => this.toastMsg('当前金额不包含手续费，手续费按退改规则计算，以最终退票单为准。')}>
                                    <AntDesign name={'infocirlce'} size={20} color={Theme.theme} />
                                </TouchableOpacity>
                            ) : order.Status === FlightEnum.OrderStatus.TicketRescheduling ? (
                                <TouchableOpacity style={{ marginLeft: 5 }} onPress={() => this.toastMsg('改签将产生票面差价及改期费，改期费用按退改规则计算，以最终改签单为准。')}>
                                    <AntDesign name={'infocirlce'} size={20} color={Theme.theme} />
                                </TouchableOpacity>
                            ) : null
                        }
                        {/* {
                            order.SupplierType === FlightEnum.SupplierType.chunqiuAir ?
                                <CustomText style={{marginLeft:10,backgroundColor:Theme.theme,color:'white',padding:2,fontSize: 12}} text='航司官网' />
                                : null
                        }
                         {
                            order.SupplierType === FlightEnum.SupplierType.gw51Book ?
                                <CustomText style={{marginLeft:10,backgroundColor:Theme.theme,color:'white',padding:2,fontSize: 12}} text='渠道价' />
                                : null
                        }
                          {
                            order.SupplierType === FlightEnum.SupplierType.ibePlus ?
                                <CustomText style={{marginLeft:10,backgroundColor:Theme.theme,color:'white',padding:2,fontSize: 12}} text='商旅优选' />
                                : null
                        } */}
                        {/* {
                            productCabins && productCabins.map((item, index) => {
                                return (
                                    <CustomText style={{
                                        color: '#fff', fontSize: 11,
                                        backgroundColor: index % 2 == 1 ? Theme.theme : Theme.orangelableColor,
                                        paddingHorizontal: 6, marginLeft: 4,borderRadius:2,paddingVertical:2
                                    }}
                                        onPress={() => { 
                                            this.showAlertView(Util.Parse.isChinese()? item.ProductDesc: item.ProductEnDesc,()=>{
                                                return ViewUtil.getAlertButton("确定",()=>{
                                                    this.dismissAlertView();
                                                })
                                            })
                                        }}
                                        text={item.ProductTag}
                                    />)
                            })
                        } */}

                    </View>
                    {/* <TouchableOpacity onPress={() => { this.setState({ showPrice: !this.state.showPrice }) }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <CustomText style={{ color: '#6DC17F', fontSize: 13 }} text={showPrice ? '收起详情' : '展开详情'} />
                            <Ionicons name={showPrice ? 'chevron-up' : 'chevron-down'} size={24} color={'#6DC17F'} style={{ marginRight: 5 }} />
                        </View>
                    </TouchableOpacity> */}
                </View>
                {
                    showPrice && order.OrderType === FlightEnum.OrderType.Reissue && order.ReissueInfo ? (
                        <View style={{ }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: "center", paddingVertical:5 }}>
                                    <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='票面差' />
                                </View>

                                <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 14 }} text={'¥' + order.ReissueInfo.PriceDiff} />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical:5 }}>
                                <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='税差' />
                                <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 14 }} text={'¥' + order.ReissueInfo.TaxDiff} />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical:5 }}>
                                <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='改签费' />
                                <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 14 }} 
                                            text={order.ReissueInfo.ReissueAmount==0?order.ReissueInfo.RefundChargeDesc:('¥' + order.ReissueInfo.ReissueAmount)}
                                />
                            </View>
                            {
                                IsShowServiceFee ?
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: "center",
                                            paddingVertical:5
                                        }}>
                                            <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='服务费' />
                                            {
                                                order.ServiceCharge > 0 ?
                                                    <AntDesign name={'questioncircle'} color={Theme.theme} size={16} style={{ marginHorizontal: 5 }} onPress={this.showServiceInfo} />
                                                    : null
                                            }
                                        </View>

                                        <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 14 }} text={'¥' + order.ServiceCharge} />
                                    </View>
                                    : null
                            }
                        </View>) : showPrice ? (
                            <View style={{ }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', alignItems: "center" , paddingVertical:5,paddingTop:15}}>
                                        <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='票面' />
                                        {
                                            order.OrderAir && order.OrderAir.IsCompanyFarePrice && order.OrderAir.PubPrice > order.OrderAir.Price > 0 ?
                                                < View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical:5 }}>
                                                    <CustomText text='大客户政策' style={{ marginLeft: 5, fontSize: 14 }} />
                                                    <AntDesign name={'questioncircle'} color={Theme.theme} size={18} style={{ marginHorizontal: 5 }} onPress={() => { this.toastMsg('贵司与航司签署的优惠合作协议') }} />
                                                    <CustomText text={'已节省' + (order.OrderAir.PubPrice - order.OrderAir.Price) + '元'} style={{ fontSize: 14 }} />
                                                </View>
                                                : null
                                        }
                                    </View>

                                    <CustomText style={{ color: Theme.fontColor, fontSize: 14, paddingVertical:5,paddingTop:15 }} text={'¥' + (order.OrderType === FlightEnum.OrderType.Refund ? '-' : '') + order.Price} />
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical:5 }}>
                                    <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='民航基金+燃油' />
                                    <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'¥' + (order.OrderType === FlightEnum.OrderType.Refund ? '-' : '') + order.Tax} />
                                </View>
                                {
                                    bindProduct.length > 0 ? bindProduct : null
                                }
                                {
                                    order.OrderType === FlightEnum.OrderType.Issued && order.InsureAmount > 0 ? (
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical:5 }}>
                                            <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='保险' />
                                            <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'¥' + order.InsureAmount} />
                                        </View>
                                    ) : null
                                }{
                                    IsShowServiceFee ? (
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical:5 }}>
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
                                {
                                    order.OrderType === FlightEnum.OrderType.Refund && order.RefundInfo ? (
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical:5 }}>
                                            <CustomText style={{ color: Theme.aidFontColor, fontSize: 14 }} text='退票费' />
                                            <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 14 }} text={ order.RefundInfo.RefundAmount==0?order.RefundInfo.RefundChargeDesc:('¥' + order.RefundInfo.RefundAmount)} />
                                        </View>
                                    ) : null
                                }
                            </View>
                        ) : null
                }
            </View >
        );
    }
    _LeftTitleBtn = () => {
        this.pop();     
    }
    componentWillUnmount() {
        super.componentWillUnmount();
        this.backPress.componentWillUnmount();
    }
    renderBody() {
        const { order, customerInfo } = this.state;
        if(!order){return}
        let showBtn = (this.params.userInfoId === order.CreateEmployeeId || this.params.userInfoId === order.Creator?.Id) ? true : false;
        return(
            <View style={{flex:1}}>
            <LinearGradient start={{x: 1, y: 0}} end={{x: 1, y: 0.5}} style={{flex:1}} colors={[Theme.theme,Theme.normalBg]}>
                {<View>
                {/* <View style={{flexDirection:'row',paddingHorizontal:15,justifyContent:'space-between',height:44,alignItems:'center'}}>
                    <TouchableOpacity onPress={()=>{this._LeftTitleBtn()}}>
                        <AntDesign name={'arrowleft'} size={20} color={'#fff'} />
                    </TouchableOpacity>
                    <CustomText style={{fontSize:16, color:'#fff'}} text={'订单详情'}></CustomText>
                    <CustomText style={{fontSize:16, color:'#fff'}} text={''}></CustomText>
                </View> */}
                <ScrollView style={{}} showsVerticalScrollIndicator={false} >
                    <View style={{paddingHorizontal:10}}>
                        <CustomText style={{ color:'#fff', fontSize: 24, paddingHorizontal:20 }} text={I18nUtil.translate(order.StatusDesc)} />
                        <CustomText style={{ color:'#fff', fontSize: 12, paddingHorizontal:20, marginTop:5}} text={`${I18nUtil.translate('订单号')}：${order.SerialNumber}`} />
                        <View style={{backgroundColor:'#fff',borderRadius:6,padding:10,paddingHorizontal:20,marginTop:25,paddingTop:20}}>
                            <DetailHeaderView order={order} otwTHis={this} />
                            <View style={{height:1,backgroundColor:Theme.themeLine,paddingHorizontal:20,marginTop:20}}></View>
                            {this._travellerInfo(order)}
                        </View>
                        <View style={{backgroundColor:'#fff',borderRadius:6,padding:10,paddingHorizontal:20,marginTop:10,paddingTop:20}}>
                            {this._tInfo(order)}
                            {this._lowPticeInfo(order)}
                        </View>
                        <View style={{backgroundColor:'#fff',borderRadius:6,padding:10,paddingHorizontal:20,marginTop:10,paddingTop:20,marginBottom:-50}}>
                            {this._priceInfo(order)}
                        </View>
                    </View>
                    <OrderDetailInfoView order={order} otwThis={this} customerInfo={customerInfo} showImage={(url) => {
                        this.setState({
                            showImageUrl: url,
                            visible: true
                        })
                    }} />
                    <View style={{height:50}}></View>
                    {this._renderShowBigImage()}
                    <RuleView ref={o => this.ruleView = o} />
                    <RuleView2 ref={o => this.ruleView2 = o} />
                </ScrollView>
                </View>}
           </LinearGradient>
                {   
                    !this.params.isApprove && showBtn && order.Status === FlightEnum.OrderStatus.TicketIssued && (order.CanReissue || order.CanRefund) ?
                    ViewUtil.getTwoBottomBtn('改签',this._ValidateTicket1,'退票',this._ValidateTicket2)
                    :null
                }
                {
                    this.params.isApprove && this.params.approveShow&& order.Status===2? 
                    ViewUtil.getTwoBottomBtn('驳回',this._rejectConfim,'同意',this._agreeConfim)
                    : null
                }
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
                        <Image style={{ width: screenWidth-20, height: screenHeight-20, resizeMode:'contain' }} source={{ uri: this.state.showImageUrl }} />
                    </View>
                </TouchableHighlight>
            </Modal>
        )
    }

}
const getStatePorps = state => ({
    comp_userInfo: state.comp_userInfo
})
export default connect(getStatePorps)(FlightOrderDetailScreen);
const styles = StyleSheet.create({

})
