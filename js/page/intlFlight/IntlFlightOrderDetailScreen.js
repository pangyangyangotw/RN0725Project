import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    DeviceEventEmitter,
    TouchableOpacity,
    TouchableHighlight,
    Modal,
    Image
} from 'react-native';
import SuperView from '../../super/SuperView';
import UserInfoDao from '../../service/UserInfoDao';
import FlightService from '../../service/FlightService';
import CustomText from '../../custom/CustomText';
import FlightEnum from '../../enum/FlightEnum';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Theme from '../../res/styles/Theme';
import I18nUtil from '../../util/I18nUtil';
import Util from '../../util/Util';
import Ionicons from 'react-native-vector-icons/Ionicons';
import OrderDetailInfoView from '../common/OrderDetailInfoView';
import CustomeTextInput from '../../custom/CustomTextInput';
import Key from '../../res/styles/Key';
import ViewUtil from '../../util/ViewUtil';
import InflFlightService from '../../service/InflFlightService';
import DetailHeaderView from './DetailHeaderView';
import PolicyView from './PolicyView';
import PolicyView2 from './PolicyView2';
import CommonService from '../../service/CommonService';
import { connect } from 'react-redux';
import  LinearGradient from 'react-native-linear-gradient';
import {TitleView,TitleView2} from '../../custom/HighLight';
import HighLight from '../../custom/HighLight';


class IntlFlightOrderDetailScreen extends SuperView {
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
            // showPrice: true,
            comment: '',
            IsShowServiceFee:true,
            visible: false,
            showImageUrl: '',
            noChooseSeatAirlineConfig: []
        }
    }

    _LeftTitleBtn(){
        this.pop();
    }

    componentDidMount() {
        const { order } = this.params;
        this.showLoadingView();
        UserInfoDao.getCustomerInfo().then(response => {
            let detailFetch; 
            if(this.params.enterprise){
                detailFetch =InflFlightService.Enterprise_orderDetail
            }else{
                detailFetch =InflFlightService.orderDetail
            }
            let Id = this.params.order.Id?this.params.order.Id:order
            detailFetch(Id).then(detail => {
                this.hideLoadingView();
                if (detail && detail.success) {
                    let orderDetail = detail.data;
                    orderDetail.OrderType = order.OrderType;
                    orderDetail.OrderTypeDesc = order.OrderTypeDesc;
                    orderDetail.AirportCities = orderDetail.AirportCities ? orderDetail.AirportCities : order.AirportCities;
                    this._buildDetail(orderDetail);
                    this.setState({
                        customerInfo: response,
                        order: orderDetail
                    },()=>{
                         //服务费
                        //  let referencEmployeeId
                        //     if(this.props.comp_userInfo&&this.props.comp_userInfo.employees){
                        //         let num = this.props.comp_userInfo&&this.props.comp_userInfo.employees.length-1
                        //         referencEmployeeId = this.props.comp_userInfo.employees[num].PassengerOrigin.EmployeeId
                        //     }else{
                        //         referencEmployeeId = userInfo.Id
                        //     }
                         var nationalCodes = [order.DepartureCode,order.DestinationCode];
                         let model={
                            OrderCategory:7,
                            MatchModel:{
                                NationalCodes:JSON.stringify(nationalCodes) 
                            },
                            // ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
                            // ReferencePassengerId:referencEmployeeId,
                        }
                        CommonService.CurrentCustomerServiceFees(model).then(response => {
                            if (response && response.success) {
                                this.setState({
                                    IsShowServiceFee:response.data.IsShowServiceFee
                                })
                            }
                        }).catch(error => {
                           
                        })
                    })
                } else {
                    this.toastMsg(detail.message || '获取数据失败');
                }
            }).catch(error => {
                this.hideLoadingView();
                this.toastMsg(error.message || '获取数据失败');
            })
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })

        this._fetchNoChooseSeatAirlineConfig();
    }
    _fetchNoChooseSeatAirlineConfig = () => {
        let melaModel = {
            Key: "noChooseSeatAirlineConfig"
        }
        CommonService.GetMelaData(melaModel).then(response => {
            if (response && response.success && response.data) {
                let cfg = response.data.noChooseSeatAirlineConfig ?? response.data.NoChooseSeatAirlineConfig ?? response.data;
                if (typeof cfg === 'string') {
                    try {
                        cfg = JSON.parse(cfg);
                    } catch (e) {
                        cfg = [];
                    }
                }
                this.setState({
                    noChooseSeatAirlineConfig: Array.isArray(cfg) ? cfg : [],
                })
            }
        }).catch(error => {
        })
    }
    _getNoChooseSeatSet = () => {
        const list = Array.isArray(this.state.noChooseSeatAirlineConfig) ? this.state.noChooseSeatAirlineConfig : [];
        const blocked = list
            .map((it) => {
                if (!it) return '';
                const v = (typeof it === 'string' || typeof it === 'number')
                    ? String(it)
                    : (it.Code || it.code || it.Airline || it.airline || it.AirlineCode || it.airlineCode || '');
                return String(v).trim().toUpperCase();
            })
            .filter(Boolean);
        return new Set(blocked);
    }
    _canChooseSeatByAirlines = (order) => {
        const o = order || {};
        const blockedSet = this._getNoChooseSeatSet();
        if (!blockedSet || blockedSet.size === 0) return true;
        const airlines = Array.isArray(o.Airlines) ? o.Airlines : [];
        if (airlines.length > 0) {
            return airlines.some((it) => {
                const code = it && (it.Code || it.code || it.Airline || it.airline || it.AirlineCode || it.airlineCode);
                const v = String(code || '').trim().toUpperCase();
                if (!v) return true;
                return !blockedSet.has(v);
            });
        }
        const singleCode = String(o.Airline || o.AirlineCode || o.Code || '').trim().toUpperCase();
        if (!singleCode) return true;
        return !blockedSet.has(singleCode);
    }
    _canChooseSeatByShareAirlineCode = (order) => {
        const o = order || {};
        const blockedSet = this._getNoChooseSeatSet();
        if (!blockedSet || blockedSet.size === 0) return true;
        const orderAirList = Array.isArray(o.OrderAirList) ? o.OrderAirList : [];
        if (orderAirList.length === 0) return true;
        return orderAirList.some((item) => {
            const shareCode = item && item.ShareAirlineCode;
            const v = String(shareCode || '').trim().toUpperCase();
            if (!v) return true;
            return !blockedSet.has(v);
        });
    }
    _isBeforeDeparture = (order) => {
        const o = order || {};
        const departureTimeValue = Util.Date.toDate(o.DepartureTime || o.AirList?.[0]?.DepartureTime || o.OrderAirList?.[0]?.DepartureTime);
        const depTime = departureTimeValue && departureTimeValue.getTime ? departureTimeValue.getTime() : NaN;
        const nowTime = new Date().getTime();
        return isFinite(depTime) ? nowTime < depTime : true;
    }
    _shouldShowChooseSeat = (order) => {
        const o = order || {};
        const isSeatStatus = o.Status === 4 || o.Status === 9;
        return isSeatStatus
            && this._isBeforeDeparture(o)
            && this._canChooseSeatByAirlines(o)
            && this._canChooseSeatByShareAirlineCode(o);
    }
    _chooseSeat = (order) => {
        const { noChooseSeatAirlineConfig } = this.state;
        if (!order) return;
        this.push('FlightChooseSeatScreen', { order, from: 'intlFlight', noChooseSeatAirlineConfig });
    }
    /**
    * 构建订票单详情
    */
    _buildDetail(order) {
        if (order.OrderType === 2 && order.ReissueInfo) {
            if (order.ReissueInfo.IntentDepartureDate && (order.ReissueInfo.IntentDepartureDate instanceof Date) === false) {
                order.ReissueInfo.IntentDepartureDate = Util.Date.toDate(order.ReissueInfo.IntentDepartureDate);
            }
            if (order.ReissueInfo.IntentReturnDate && (order.ReissueInfo.IntentReturnDate instanceof Date) === false) {
                order.ReissueInfo.IntentReturnDate = Util.Date.toDate(order.ReissueInfo.IntentReturnDate);
            }
        }
        var shareFlightDesc = '';
        let owJourney = { list: [] };
        let rtJourney = { list: [] };
        if (Array.isArray(order.AirList)) {
            let lastDate = null;
            //共享航班，时间处理，去程及回程分类
            order.AirList.forEach(item => {
                if (item.ShareAirlineCode && item.ShareAirlineNumber) {
                    shareFlightDesc = I18nUtil.translate('实际承运') + '  ' + (Util.Parse.isChinese() ? item.ShareAirlineName : Util.Read.domesticAirlines(item.ShareAirlineCode)) + item.ShareAirlineCode + item.ShareAirlineNumber;
                }
                if (item.CreateTime) {
                    item.CreateTime = Util.Date.toDate(item.CreateTime);
                }
                if (item.DepartureTime) {
                    item.DepartureTime = Util.Date.toDate(item.DepartureTime);
                }
                if (item.DestinationTime) {
                    item.DestinationTime = Util.Date.toDate(item.DestinationTime);
                }
                if (!item.FlightTotalTime && item.DestinationTime instanceof Date && item.DepartureTime instanceof Date) {
                    let totalTimes = item.DestinationTime.getTime() - item.DepartureTime.getTime();
                    let hours = Math.floor(totalTimes / (1000 * 60 * 60));
                    let minutes = Math.floor((totalTimes - (hours * 60 * 60 * 1000)) / (1000 * 60));
                    item.FlightTotalTime = hours + ':' + minutes;
                }
                if (item.RouteType === 22) {
                    rtJourney.list.push(item);
                } else {
                    owJourney.list.push(item);
                }
            });
            //处理去程，计算中转时间
            owJourney.list.forEach((flight, index) => {
                if (index === 0) {
                    owJourney.Departure = flight.Departure;
                    owJourney.DepartureTime = flight.DepartureTime;
                    lastDate = flight.DestinationTime;
                } else {
                    flight.transferTime = InflFlightService.getTransferTime(lastDate, flight.DepartureTime);
                    lastDate = flight.DestinationTime;
                }
                if (index === owJourney.list.length - 1) {
                    owJourney.Destination = flight.Destination;
                    owJourney.DestinationTime = flight.DestinationTime;
                }
            });
            //处理回程，计算中转时间
            rtJourney.list.forEach((flight, index) => {
                if (index === 0) {
                    rtJourney.Departure = flight.Departure;
                    rtJourney.DepartureTime = flight.DepartureTime;
                    lastDate = flight.DestinationTime;
                }
                else {
                    flight.transferTime = InflFlightService.getTransferTime(lastDate, flight.DepartureTime);
                    lastDate = flight.DestinationTime;
                }
                if (index === rtJourney.list.length - 1) {
                    rtJourney.Destination = flight.Destination;
                    rtJourney.DestinationTime = flight.DestinationTime;
                }
            });
        }
        owJourney.DepartureEname = owJourney.Departure;
        owJourney.DestinationEname = owJourney.Destination;
        rtJourney.DepartureEname = rtJourney.Departure;
        rtJourney.DestinationEname = rtJourney.Destination;
        if (Array.isArray(order.AirportCities) && order.AirportCities.length > 0) {
            order.AirportCities.forEach((item, index) => {
                if (item.CityName === owJourney.Departure) {
                    owJourney.DepartureEname = item.CityEnName;
                }
                if (item.CityName === owJourney.Destination) {
                    owJourney.DestinationEname = item.CityEnName;
                }
                if (item.CityName === rtJourney.Departure) {
                    rtJourney.DepartureEname = item.CityEnName;
                }
                if (item.CityName === rtJourney.Destination) {
                    rtJourney.DestinationEname = item.CityEnName;
                }
                if (order.ReissueInfo && item.CityName === order.ReissueInfo.OldDeparture) {
                    order.ReissueInfo.OldEdeparture = item.CityEnName;
                }
                if (order.ReissueInfo && item.CityName === order.ReissueInfo.OldDestination) {
                    order.ReissueInfo.OldEdestination = item.CityEnName;
                }

            })
        }

        order.shareFlightDesc = shareFlightDesc;
        order.owJourney = owJourney;
        order.rtJourney = rtJourney;
    }

    /**
     *  改签
     */
    _orderReschedule = (order) => {
        this.push('IntlFlightOrderReissue', {order:order});
    }
    /**
     *  退票
     */
    _orderRefund = (order) => {
        this.push('IntlFlightOrderRefund', {
            order:order
        });
    }

    /**
     *  同意
     * @param  order 
     */
    _agreeConfim = (order) => {
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
        const { comment } = this.state;
        let model = { OrderId: order.Id, Status: 1,Comment: comment };
        this.showLoadingView();
        InflFlightService.approve(model).then(response => {
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
    _rejectConfim = (order) => {
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
        InflFlightService.approve(model).then(response => {
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
    _showPdf = (ticket) => {
        this.push('PdfDisplay', { url: { uri: ticket.ETicketPath } });

    }
    /**
     *  显示规改规则
     */
    _showRules = (index) => {
        if(index===1){
            this.policyView.show(this.state.order);
        }else{
            this.policyView2.show(this.state.order);
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
            <View style={{  }}>
                 <View style={{ flexDirection: 'row', alignItems: 'center',marginTop:10, }}>
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 12 }} text='改签原因' />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 12 }} text='：' />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 12, flex: 1 }} numberOfLines={1} text={'jjkkjhkjhjkhkjhkhkjh'} />
                        </View>
                {
                    order.ReissueInfo ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 12 }} text='改签原因' />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 12 }} text='：' />
                            <CustomText style={{ color: Theme.specialColor2, fontSize: 12, flex: 1 }} numberOfLines={1} text={order.ReissueInfo.ReasonDesc} />
                        </View>
                    ) : null
                }
                {
                    order.RefundInfo ? (
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
                        <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 10, flex: 1 }} numberOfLines={1} text={obj.Reason} />
                    </View>
                )
            }
            if (obj.Reason && obj.RuleType == 2) {
                obj.Reason = obj.Reason.replace(' ', '');
                arr.push(
                    <View key={i} style={{ flexDirection: 'row', marginTop: 5, flex: 1, alignItems: 'center' }}>
                        <AntDesign name={'infocirlce'} size={16} color={Theme.theme} style={{ marginRight: 2 }} />
                        <CustomText style={{ color: Theme.specialColor2, fontSize: 10 }} text='违反提前预定规则原因：' />
                        <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 10, flex: 1 }} numberOfLines={1} text={obj.Reason} />
                    </View>
                )
            }
            if (obj.Reason && obj.RuleType == 7) {
                obj.Reason = obj.Reason.replace(' ', '');
                arr.push(
                    <View key={i} style={{ flexDirection: 'row', marginTop: 5, flex: 1, alignItems: 'center' }}>
                        <AntDesign name={'infocirlce'} size={16} color={Theme.theme} style={{ marginRight: 2 }} />
                        <CustomText style={{ color: Theme.specialColor2, fontSize: 10 }} text='违反指定折扣的原因：' />
                        <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 10, flex: 1 }} numberOfLines={1} text={obj.Reason} />
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
   * 渲染意向信息
   */
    _renderPurpose = (order) => {
        if (order.OrderType !== 2 || !order.ReissueInfo) {
            return null;
        }
        if (order.ReissueInfo.IntentDesc || order.ReissueInfo.IntentReturnDate || order.ReissueInfo.IntentDepartureDate) {
            return (
                <View style={{ backgroundColor: 'white',borderRadius:6,marginTop:10,paddingTop:10,paddingBottom:20 }}>
                    {
                        order.ReissueInfo.IntentDepartureDate ? (
                            <View style={{ marginHorizontal: 20, paddingVertical: 10, flexDirection: 'row', borderBottomColor: Theme.lineColor, borderBottomWidth: 1 }}>
                                <CustomText style={[curStyle.aidFont, { flex: 3 }]} text='意向去程日期' />
                                <Text allowFontScaling={false} style={[curStyle.mainFont, { flex: 7 }]}>{order.ReissueInfo.IntentDepartureDate && order.ReissueInfo.IntentDepartureDate.format('yyyy-MM-dd')}</Text>
                            </View>
                        ) : null
                    }
                    {
                        order.ReissueInfo.IntentReturnDate ? (
                            <View style={{ marginHorizontal: 20, paddingVertical: 10, flexDirection: 'row', borderBottomColor: Theme.lineColor, borderBottomWidth: 1 }}>
                                <CustomText style={[curStyle.aidFont, { flex: 3 }]} text='意向回程日期' />
                                <Text allowFontScaling={false} style={[curStyle.mainFont, { flex: 7 }]}>{order.ReissueInfo.IntentReturnDate && order.ReissueInfo.IntentReturnDate.format('yyyy-MM-dd')}</Text>
                            </View>
                        ) : null
                    }
                    {
                        order.ReissueInfo.IntentDesc ? (
                            <Text allowFontScaling={false} style={{ marginHorizontal: 20, marginVertical: 10, color: Theme.aidFontColor }}>{I18nUtil.translate('意向描述')}：{order.ReissueInfo.IntentDesc}</Text>
                        ) : null
                    }
                    {
                        order.ReissueInfo ? (
                            <Text allowFontScaling={false} style={{ marginHorizontal: 20, color: Theme.aidFontColor }}>{I18nUtil.translate('原行程类型')}： {Util.Parse.isChinese() ? order.ReissueInfo.OldDeparture : order.ReissueInfo.OldEdeparture} - {Util.Parse.isChinese() ? order.ReissueInfo.OldDestination : order.ReissueInfo.OldEdestination} </Text>
                        ) : null
                    }
                </View>
            );
        }
        return null;
    }
    /**
    * 乘客信息
    */
    _travellerInfo(order) {
        if (!order.PassengerList || order.PassengerList.length == 0) {
            return null;
        }
        return (
            <View style={{ backgroundColor: 'white', padding: 10,marginVertical:10 ,borderRadius:6,paddingHorizontal:20 }}>
                <View style={{ backgroundColor: 'white', flexDirection: 'row',paddingVertical:10}}>
                    {/* <View style={{flexDirection:'row'}}>
                        <AntDesign name={'team'} size={16} color={Theme.theme} style={{ marginRight: 5 }} />
                        <CustomText text='乘机人' style={{fontSize:14}}/>
                    </View> */}
                    <TitleView2 title={'乘机人'} style={{}}></TitleView2>
                    <View style={{ marginLeft:15}}>
                        {
                            order.PassengerList.map((passenger, index) => {
                                const certicate = passenger.Certificate;
                                let ticket = passenger.TicketList && passenger.TicketList.length > 0 ? passenger.TicketList[0] : null;
                                return (
                                    <View key={index} style={[{  }, index === 0 ? null : { borderTopColor: Theme.lineColor, borderTopWidth: 1 ,paddingTop:5}]}>
                                        <View style={{flexDirection:'row',alignItems:'center',justifyContentL:'center' }}>
                                            <CustomText style={{ color: Theme.annotatedFontColor }} text={'姓名'} />
                                            <CustomText style={{ color: Theme.annotatedFontColor }} text={'：'} />
                                            <Text allowFontScaling={false} style={curStyle.mainFont}>{passenger.LastName+" "+passenger.FirstName}</Text>
                                        </View>
                                        <Text allowFontScaling={false} style={[curStyle.mainFont, { marginVertical: 5 ,width:220}]}>{I18nUtil.translate(certicate.TypeDesc)}：{Util.Read.simpleReplace(certicate.SerialNumber)}</Text>
                                        <View style={{flexDirection:'row',alignItems:'center',justifyContentL:'center' }}>
                                            <CustomText style={{ color: Theme.annotatedFontColor }} text={'票号'} />
                                            <CustomText style={{ color: Theme.annotatedFontColor }} text={'：'} />
                                            <Text allowFontScaling={false} style={curStyle.mainFont}>{passenger.TicketList&&passenger.TicketList.length>0?passenger.TicketList[0].TicketNumber:''}</Text>
                                        </View>
                                        {/* <Text allowFontScaling={false} style={curStyle.mainFont}>{I18nUtil.translate('电话')}：{passenger.Mobile&&passenger.Mobile.replace(/(\d{3})(\d{4})(\d{4})/,"$1****$3")}</Text> */}
                                        {/* {
                                            ticket ?
                                                <TouchableHighlight underlayColor='transparent' onPress={this._showPdf.bind(this, ticket)}>
                                                    <CustomText style={[curStyle.mainFont, { color: Theme.theme, marginTop: 5 }]} text='电子行程单 查看' />
                                                </TouchableHighlight> : null
                                        } */}
                                       
                                        {
                                            passenger&&passenger.Addition&&passenger.Addition.DictItemList&&passenger.Addition.DictItemList.map((item)=>{
                                                return(
                                                       item.ShowInOrder?
                                                        <View style={{flexDirection:'row',width:240 ,flexWrap:'wrap'}}>
                                                            <CustomText style={{  marginTop: 5 ,color: Theme.annotatedFontColor,}} text={Util.Parse.isChinese()?item.DictName:item.DictEnName?item.DictEnName:item.DictName} />
                                                            {/* <CustomText style={{  marginTop: 5 }} text={item.DictName} /> */}
                                                            <CustomText style={{  marginTop: 5 }} text={'：'} /> 
                                                            {item.ItemName?<CustomText style={{  marginTop: 5, color: Theme.annotatedFontColor, }} text={Util.Parse.isChinese()?item.ItemName:item.ItemEnName?item.ItemEnName:item.ItemName} />:null} 
                                                        </View>
                                                        :null
                                                )
                                            })
                                        }
                                        
                                    </View>
                                );
                            })
                        }
                    </View>
                </View>
                {
                    order.Contact && (order.Contact.Name || order.Contact.Email || order.Contact.Mobile) ? (
                        <View style={{ flexDirection: 'row', marginTop: 5, borderTopWidth: 1, borderColor: Theme.lineColor}}>
                            <TitleView2 title={'联系人'} style={{marginTop: 20,}}></TitleView2>
                            <View style={{ marginTop: 15,marginLeft:15 }}>
                                {/* <View style={{flexDirection:'row'}}> 
                                <CustomText style={{ color: Theme.annotatedFontColor }} text={'姓名'} />
                                <CustomText style={{ color: Theme.annotatedFontColor, marginLeft:7 }} text={order.Contact.Name} />
                                </View> */}
                                <View style={{flexDirection:'row'}}>
                                <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={'邮箱'} />
                                <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5, marginLeft:7 , width:220 }} text={order.Contact.Email} />
                                </View>
                                <View style={{flexDirection:'row'}}>
                                <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5 }} text={'电话'} />
                                <CustomText style={{ color: Theme.annotatedFontColor, marginTop: 5, marginLeft:7 }} text={order.Contact.Mobile} />
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
        const { customerInfo, IsShowServiceFee } = this.state;
        let price = 0;
        let tax = 0;
        if (Array.isArray(order.PassengerList) && order.PassengerList.length > 0) {
            if (Array.isArray(order.PriceList) && order.PriceList.length > 0) {
                for (let i = 0; i < order.PassengerList.length; i++) {
                    let obj = order.PassengerList[i];
                    for (let j = 0; j < order.PriceList.length; j++) {
                        let pl = order.PriceList[j];
                        if (pl.PassengerType == obj.PassengerType) {
                            const { Price = 0, Tax = 0 } = pl || {};
                            price += Price;
                            tax += Tax;
                        }
                    }
                }
            }
        }
        return (
            <View style={{ backgroundColor: 'white', marginBottom: 10,borderRadius:6, paddingHorizontal:20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomColor: Theme.lineColor, borderBottomWidth: 1  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TitleView2 title={'订单总额'} style={{paddingVertical:10}}></TitleView2>
                        {/* <CustomText style={{ color: Theme.commonFontColor, fontSize: 14,paddingVertical:10 }} text='订单总额' /> */}
                        {
                            IsShowServiceFee ? (
                                <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'：¥' + (order.Amount + order.ServiceCharge).toFixed(2)} />
                            ) : (
                                    <CustomText style={{ color: Theme.fontColor , fontSize: 14}} text={'：¥' + order.Amount.toFixed(2)} />
                                )
                        }
                    </View>
                </View>
                {
                    order.OrderType === FlightEnum.OrderType.Reissue && order.ReissueInfo ? (
                        <View style={{ paddingVertical: 10 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between',paddingVertical: 4 }}>
                                <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='票面差' />
                                <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'¥' + order.ReissueInfo.PriceDiff} />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between',paddingVertical: 4 }}>
                                <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='税差' />
                                <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'¥' + order.ReissueInfo.TaxDiff.toFixed(2)} />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between',paddingVertical: 4 }}>
                                <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='改签费' />
                                <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'¥' + order.ReissueInfo.ReissueAmount.toFixed(2)} />
                            </View>
                            {
                                IsShowServiceFee ? (
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        {/* <CustomText style={{ color: Theme.aidFontColor, fontSize: 12 }} text='服务费' /> */}
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: "center"
                                        }}>
                                            <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='服务费' />
                                            {
                                                order.ServiceCharge > 0 ?
                                                    <AntDesign name={'questioncircle'} color={Theme.theme} size={16} style={{ marginHorizontal: 5 }} onPress={this.showServiceInfo} />
                                                    : null
                                            }
                                        </View>
                                        <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'¥' + order.ServiceCharge.toFixed(2)} />
                                    </View>
                                ) : null
                            }
                        </View>) : 
                        <View style={{  }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between',paddingVertical:10 }}>
                                <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='票面' />
                                <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'¥' + (order.OrderType === FlightEnum.OrderType.Refund ? '-' : '') + price} />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='税' />
                                <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'¥' + (order.OrderType === FlightEnum.OrderType.Refund ? '-' : '') + tax} />
                            </View>

                            {
                                IsShowServiceFee ? (
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between',paddingVertical:10 }}>
                                        {/* <CustomText style={{ color: Theme.aidFontColor, fontSize: 12 }} text='服务费' /> */}
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
                                        <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'¥' + order.ServiceCharge} />
                                    </View>
                                ) : null
                            }
                            {
                                order.OrderType === FlightEnum.OrderType.Refund && order.RefundInfo ? (
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text='退票费' />
                                        <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'¥' + order.RefundInfo.RefundAmount.toFixed(2)} />
                                    </View>
                                ) : null
                            }
                        </View>
                       
                }
            </View >
        );
    }
    /** 
    *  渲染退票改签按钮
    */
    _renderRefunRessiuseBtn = (order) => {
        if (this.params.isApprove) return;
        const canShowChangeRefund = order.Status === FlightEnum.OrderStatus.TicketIssued && (order.CanReissue || order.CanRefund);
        const canShowChooseSeat = this._shouldShowChooseSeat(order);
        if (!(canShowChangeRefund || canShowChooseSeat)) return null;

        const buttons = [];
        if (canShowChooseSeat) {
            buttons.push({ key: 'seat', title: '选座', onPress: this._chooseSeat.bind(this, order), bg: Theme.theme });
        }
        if (canShowChangeRefund && order.CanReissue) {
            buttons.push({ key: 'reissue', title: '改签', onPress: this._orderReschedule.bind(this, order), bg: Theme.theme });
        }
        if (canShowChangeRefund && order.CanRefund) {
            buttons.push({ key: 'refund', title: '退票', onPress: this._orderRefund.bind(this, order), bg: Theme.specialColor2 });
        }
        if (buttons.length === 0) return null;

        return (
            <View style={{ flexDirection: 'row', height: 60, paddingHorizontal: 10 }}>
                {
                    buttons.map((btn, index) => (
                        <TouchableHighlight
                            key={btn.key}
                            style={[
                                { flex: 1, backgroundColor: btn.bg, marginVertical: 10, borderRadius: 2, marginLeft: index === 0 ? 0 : 10 },
                                { alignItems: 'center', justifyContent: 'center' }
                            ]}
                            onPress={btn.onPress}
                            underlayColor='transparent'
                        >
                            <CustomText style={{ color: 'white' }} text={btn.title} />
                        </TouchableHighlight>
                    ))
                }
            </View>
        )
    }
    /**
     *  渲染审批按钮
     */
    _renderApproveBtn = (order) => {
        if (this.params.isApprove && order.Status === 2) {
            return (
                <View>
                    {
                        ViewUtil.getTwoBottomBtn('驳回',this._rejectConfim.bind(this, order),'同意',this._agreeConfim.bind(this, order))
                    }
                    {/* <TouchableHighlight style={[{ flex: 1, backgroundColor: Theme.theme, margin: 10, borderRadius: 2 }, { alignItems: 'center', justifyContent: 'center' }]} onPress={this._agreeConfim.bind(this, order)} underlayColor='transparent'>
                        <CustomText style={{ color: 'white' }} text='同意' />
                    </TouchableHighlight>
                    <TouchableHighlight style={[{ flex: 1, backgroundColor: Theme.specialColor2, margin: 10, borderRadius: 2 }, { alignItems: 'center', justifyContent: 'center' }]} onPress={this._rejectConfim.bind(this, order)} underlayColor='transparent'>
                        <CustomText style={{ color: 'white' }} text='驳回' />
                    </TouchableHighlight> */}
                </View>
            )
        }
    }
    renderBody() {
        const { order, customerInfo } = this.state;
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
                    <View style={{paddingHorizontal:10}}>
                        <CustomText style={{  color:'#fff', fontSize: 24, paddingHorizontal:20}} numberOfLines={1} text={ I18nUtil.translate(order.StatusDesc)} />
                        <CustomText style={{ color:'#fff', fontSize: 12, paddingHorizontal:20, marginTop:5}} text={`${I18nUtil.translate('订单号')}：${order.SerialNumber}`} />

                        <DetailHeaderView order={order} showRules={(index)=>this._showRules(index)}  _ruleReasonShow={this._ruleReasonShow} otwThis={this}/>
                        {/* {this._orderInfo(order)} */}
                        {this._renderPurpose(order)}
                        {this._travellerInfo(order)}
                        <View style={{ flexDirection: 'row', height: 44, paddingHorizontal: 20, backgroundColor: 'white', alignItems: 'center',borderRadius:6 }}>
                            <CustomText style={{ color: Theme.commonFontColor,fontSize:14 }} text='PNR信息' />
                            {
                                <CustomText style={{ flex: 1, textAlign: 'right', fontSize: 14, color: Theme.fontColor }} text={order.Pnr?.PnrCode} />
                            }
                        </View>
                        <View style={{ flexDirection: 'row', height: 44, paddingHorizontal: 20, backgroundColor: 'white', alignItems: 'center',borderRadius:6,marginBottom:10 }}>
                            <CustomText style={{ color: Theme.commonFontColor,fontSize:14 }} text='出票时限' />
                            {
                                <CustomText style={{ flex: 1, textAlign: 'right', fontSize: 14, color: Theme.fontColor }} text={new Date(order.Pnr?.TicketDraftLimit).toLocaleString().replace('T', ' ')} />
                            }
                        </View>
                        <View style={{marginBottom:-20}}>
                        {this._priceInfo(order)}
                        </View>
                    </View>    
                    <OrderDetailInfoView order={order} otwThis={this} customerInfo={customerInfo} showImage={(url) => {
                        this.setState({
                            showImageUrl: url,
                            visible: true
                        })
                    }} />
                    {this._renderShowBigImage()}
                    {this.params.index&&this.params.index==2?null:this._renderRefunRessiuseBtn(order)}
                    {/* {this._renderApproveBtn(order)} */}
                    <PolicyView ref={o => this.policyView = o} order={order} type='createOrder' />
                    <PolicyView2 ref={o => this.policyView2 = o} order={order} type='createOrder' />
                    <View style={{height:20}}></View>
                </ScrollView>
            </LinearGradient>
            {this._renderApproveBtn(order)}
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
const curStyle = StyleSheet.create({
    aidFont: {
        // color: Theme.aidFontColor
    },
    mainFont: {
        color: Theme.specialColor
    },
})

const getStateProps = state => ({
    comp_userInfo: state.comp_userInfo,
})

export default connect(getStateProps)(IntlFlightOrderDetailScreen);
