import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    TouchableHighlight,
    Platform,
    DeviceEventEmitter
} from 'react-native';
import SuperView from '../../super/SuperView';
import CheckBox from '../../custom/CheckBox';
import IntlFlightService from '../../service/InflFlightService';
import PolicyView from './PolicyView';
import PolicyView2 from './PolicyView2';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CustomText from '../../custom/CustomText';
import CustomTextInput from '../../custom/CustomTextInput';
import Theme from '../../res/styles/Theme';
import Util from '../../util/Util';
import I18nUtil from '../../util/I18nUtil';
import CustomActioSheet from '../../custom/CustomActionSheet';
import UserInfoDao from '../../service/UserInfoDao';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ViewUtil from '../../util/ViewUtil';
import  LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import DetailHeaderView from './DetailHeaderView';
import {TitleView,TitleView2} from '../../custom/HighLight';
/**
 * 国际机票退票申请
 */
export default class InflFlightOrderRefundScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title:'退票申请',
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
        this.state = {
            showLoading: true,
            showJourneyDetail: false,
            showSelectFlight: true,
            showSelectReason: true,
            selectedFlight: null,
            selectedReason: null,
            selectedPassenger: [],
            order: null,
            options: ['行程改变', '航班变动', '其他'],
            otherReason: ''
        }
    }

    componentDidMount() {
        const { order } = this.params;
        this.showLoadingView();
        UserInfoDao.getUserInfo().then(userInfo => {
            if (userInfo && userInfo.Customer) {
                this.customer = userInfo.Customer;
                this.customerEmployee = {
                    Id: userInfo.Id,
                    Name: userInfo.Name
                };
                IntlFlightService.orderDetail(order.Id).then(response => {
                    this.hideLoadingView();
                    if (response && response.success && response.data) {
                        this._processOrderDetail(response.data);
                        this.setState({ showLoading: false, order: response.data });
                    } else {
                        this.hideLoadingView();
                        this.toastMsg(response.message || '获取订单详情异常');
                    }
                }).catch(err => {
                    this.hideLoadingView();
                    this.toastMsg('获取订单详情异常');
                });
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取当前用户失败');
        });
    }
    componentWillUnmount() {
        DeviceEventEmitter.emit('IntlFlightOrderListChange', {});
    }

    /**
     * 处理订单详情数据
     */
    _processOrderDetail = (order) => {
        this.fromList = [];
        this.toList = [];
        order.AirList.forEach(orderAir => {
            if (orderAir.DepartureTime) {
                orderAir.DepartureTime = Util.Date.toDate(orderAir.DepartureTime);
            }
            if (orderAir.DestinationTime) {
                orderAir.DestinationTime = Util.Date.toDate(orderAir.DestinationTime);
            }
            if (orderAir.RouteType === 22) {
                this.toList.push(orderAir);
            } else {
                this.fromList.push(orderAir);
            }
        });
        this.flightItems = [];
        if (this.fromList.length > 0) {
            if (this.fromList[0].DepartureTime instanceof Date) {
                this.flightItems.push({ name: '去程', text: this.fromList[0].DepartureTime.format('yyyy-MM-dd') });
            } else {
                let index = fromList[0].DepartureTime.indexOf('T');
                this.flightItems.push({ name: '去程', text: this.fromList[0].DepartureTime.substr(0, index) })
            }
        }
        if (this.toList.length > 0) {
            if (this.toList[0].DestinationTime instanceof Date) {
                this.flightItems.push({ name: '回程', text: this.toList[0].DestinationTime.format('yyyy-MM-dd') });
            } else {
                let index = this.toList[0].DepartureTime.indexOf('T');
                this.flightItems.push({ name: '回程', text: this.toList[0].DestinationTime.substr(0, index) })
            }
        }
        if (this.fromList.length > 0 && this.toList.length > 0) {
            this.flightItems.push({ name: '往返', text: '' });
        }
    }


    _selectPassenger = (item) => {
        let index = this.state.selectedPassenger.indexOf(item);
        if (index === -1) {
            this.state.selectedPassenger.push(item);
        } else {
            this.state.selectedPassenger.splice(index, 1);
        }
        this.setState({ selectedPassenger: this.state.selectedPassenger });
    }

    _orderCancel = () => {
        this.pop();
    }

    _orderRefund = () => {
        const { selectedFlight, selectedPassenger, selectedReason, order } = this.state;
        if (!selectedFlight) {
            this.toastMsg('请选择退票航班');
            return;
        }
        if (selectedPassenger.length === 0) {
            this.toastMsg('请选择乘机人');
            return;
        }
        if (!selectedReason) {
            this.toastMsg('请选择退票原因');
            return;
        } 
        // else {
        //     if (!this.state.otherReason) {
        //         this.toastMsg('请填写退票的其他原因');
        //         return;
        //     }
        // }
        let airList = null;
        if (selectedFlight.name === '去程') {
            airList = Util.Encryption.clone(this.fromList);
        } else if (selectedFlight.name === '回程') {
            airList =  Util.Encryption.clone(this.toList);

        } else if (selectedFlight.name === '往返') {
            airList =  Util.Encryption.clone(order.AirList);
        }
        airList.forEach((item, index) => {
            if (item.DepartureTime instanceof Date) {
                item.DepartureTime = item.DepartureTime.format('yyyy-MM-dd HH:mm:ss', true);
            }
            if (item.DestinationTime instanceof Date) {
                item.DestinationTime = item.DestinationTime.format('yyyy-MM-dd HH:mm:ss', true);
            }
            airList[index] = item;
        })
        let model = {
            OrderId: order.Id,
            ReasonCode: selectedReason.code,
            ReasonDesc: this.state.otherReason,
            PassengerList: selectedPassenger,
            AirList: airList,
            Customer: this.customer,
            CustomerEmployee: this.customerEmployee,
            Platform: Platform.OS
        };
        this.showLoadingView();
        IntlFlightService.orderRefund(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                this.toastMsg('提交退票成功');
                DeviceEventEmitter.emit('goHome', {});
                this.pop();
            } else {
                this.toastMsg(response.message || '提交退票失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '提交退票异常');
        });
    }

    _alertBtnClick = () => {
        this.setState({ alertShowing: false }, () => {
            this.navReset(['Home', 'IntlFlightOrderList'], null, 1);
        });
    }

    _selectReason = (index) => {

        switch (index) {
            case 0:
                this.state.selectedReason = { code: 1, reason: '行程改变' };
                break;
            case 1:
                this.state.selectedReason = { code: 2, reason: '航班变动' };
                break;
            case 2:
                this.state.selectedReason = { code: 3, reason: null };
                break;
        }
        this.setState({});
    }

    renderBody() {
        const { order } = this.state;
        if (!order) {
            return null;
        }
        return (
            <View style={{ flex: 1 }}>
                <LinearGradient  start={{x: 1, y: 0}} end={{x: 1, y: 0.5}} style={{flex:1}} colors={[Theme.theme,Theme.normalBg]}>
                {/* <View style={{flexDirection:'row',paddingHorizontal:15,justifyContent:'space-between',height:44,alignItems:'center'}}>
                    <TouchableOpacity onPress={()=>{this.pop()}}>
                        <AntDesign name={'arrowleft'} size={20} color={'#fff'} />
                    </TouchableOpacity>
                    <CustomText text={'退票申请'} style={{fontSize:16, color:'#fff'}} />
                    <CustomText style={{fontSize:16, color:'#fff'}} text={''}></CustomText>
                </View> */}
                <PolicyView ref='policy' order={order} />
                <PolicyView2 ref='policy2' order={order} />
                <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
                >
                    <View style={{marginHorizontal:10,marginTop:-10}}>
                        {this._renderJourneyDetail()}
                        {this._renderSelectFlight()}
                        {this._renderSelectPassenger()}
                        {this._renderSelectReason()}
                    </View>
                    <View style={{height:20}}></View>
                    <CustomActioSheet ref={o => this.actionSheet = o} options={this.state.options} onPress={this._selectReason}/>
                </KeyboardAwareScrollView>
                </LinearGradient>
                {
                    ViewUtil.getTwoBottomBtn('重新选择',this._orderCancel,'确定退票',this._orderRefund)
                }
            </View>
        );
    }

    _renderSelectFlight = () => {
        const { showSelectFlight, selectedFlight } = this.state;

        return (
            <View style={{ backgroundColor: 'white', marginTop: 10,padding:10,borderRadius:4 }}>
                <View style={{ padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TitleView2 title='选择退票航班'></TitleView2>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {/* <CustomText style={{ color: Theme.aidFontColor, fontSize: 13 }} text='请选择' /> */}
                        <AntDesign name={'right'} size={16} color={Theme.assistFontColor} style={{ }} />
                    </TouchableOpacity>
                </View>
                {
                    // showSelectFlight ? (
                    this.flightItems.map((item, index) => (
                        <View key={index}>
                            <View style={{flexDirection:"row",justifyContent:'space-between',padding:10,alignItems:'center'}}>
                                <View style={{ borderTopColor: Theme.normalBg, borderTopWidth: 1, flexDirection: 'row' }}>
                                    <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 13 }} text={item.name} />
                                    <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 13, marginLeft: 20 }} text={item.text} />
                                </View>
                                <CheckBox
                                    isChecked={this.state.selectedFlight === item}
                                    onClick={() => this.setState({ selectedFlight: item, showSelectFlight: false })}
                                />
                            </View>
                        </View>
                    ))
                    // ) 
                    // : null
                }
            </View>
        );
    }

    _renderSelectPassenger = () => {
        const { PassengerList: passengerList } = this.state.order;
        if (!passengerList || !Array.isArray(passengerList) || passengerList.length === 0) {
            return null;
        }
        return (
            <View style={{ backgroundColor: 'white', marginTop: 10,padding:10,borderRadius:6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 }}>
                    <TitleView2 title='选择乘机人'></TitleView2>
                </View>
                {
                    passengerList.map((passenger, index) => (
                        <TouchableHighlight key={index} onPress={() => this._selectPassenger(passenger)} underlayColor='#f4f4f4'>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopColor: Theme.normalBg, borderTopWidth: 1, padding: 10 }}>
                                <View style={{ justifyContent: 'center' }}>
                                    <Text style={{ color: Theme.commonFontColor, fontSize: 13 }} allowFontScaling={false}>{passenger.Name}</Text>
                                    {
                                        passenger.Certificate ? (
                                            <Text allowFontScaling={false} style={{ marginTop: 5 }}>{I18nUtil.translate(passenger.Certificate.TypeDesc)}：{Util.Read.simpleReplace(passenger.Certificate.SerialNumber)}</Text>
                                        ) : null
                                    }
                                </View>
                                <CheckBox
                                    isChecked={this.state.selectedPassenger.indexOf(passenger) !== -1}
                                    onClick={() => this._selectPassenger(passenger)}
                                />
                            </View>
                        </TouchableHighlight>
                    ))
                }
            </View>
        );
    }

    _renderSelectReason = () => {
        let items = [{ code: 1, reason: '行程改变' }, { code: 2, reason: '航班变动' }, { code: 3, reason: null }];
        const { showSelectReason, selectedReason } = this.state;

        return (
            <View style={{ backgroundColor: 'white', marginTop: 10, padding:10,borderRadius:6}}>
                <View style={{ padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TitleView2 title='选择退票原因' required={true}></TitleView2>
                    <TouchableOpacity onPress={() => this.actionSheet.show()}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {
                                selectedReason ? (
                                    <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 13 }} text={selectedReason.reason ? selectedReason.reason : '其他原因'} />
                                ) : (
                                        // <CustomText style={{ color: Theme.aidFontColor, fontSize: 13 }} text='请选择' />
                                        <AntDesign name={'right'} size={16} color={Theme.assistFontColor} style={{ }} />
                                    )
                            }
                        </View>
                    </TouchableOpacity>
                </View>
            
                <CustomTextInput style={{ height: 50, borderColor: Theme.aidFontColor, borderWidth: 0.5, fontSize: 13, marginHorizontal: 10, borderColor: Theme.aidFontColor, marginBottom: 10,borderRadius:3,paddingHorizontal: 10 ,borderRadius:3 }} placeholderTextColor={Theme.aidFontColor} placeholder={'请输入退票原因'} maxLength={125} multiline={true} underlineColorAndroid={'transparent'} onChangeText={reason => {

                    this.setState({ otherReason: reason });

                }} blurOnSubmit={true} returnKeyType='done' />
                {/* ) : null
                } */}
            </View>
        );
    }

    _renderFlightDetail = (flight, index, isFrom) => {
        if (!flight) {
            return null;
        }
        let shareTxt = '';
        if (flight.ShareAirlineCode && flight.ShareAirlineNumber) {
            shareTxt = I18nUtil.translate('实际承运') + '  ' + (Util.Parse.isChinese() ? flight.ShareAirlineName : Util.Read.domesticAirlines(flight.ShareAirlineCode)) + flight.ShareAirlineCode + flight.ShareAirlineNumber;
            // shareTxt = `实际共享航班 ${flight.ShareAirlineName} ${flight.ShareAirlineCode}${flight.ShareAirlineNumber}`;
        }
        return (
            <View key={index} style={{ borderBottomColor: Theme.lineColor, borderBottomWidth: 1, padding: 5 }}>
                <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 13 }}>{Util.Parse.isChinese() ? flight.AirlineName : ''}{flight.AirlineCode}{flight.AirlineNumber}  {Util.Parse.isChinese() ? flight.CabinName : flight.CabinCode + ' '}{flight.ServiceCabin}  {shareTxt}</Text>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ flex: 1 }}>
                        <Text allowFontScaling={false} style={{ fontSize: 20 }}>{flight.DepartureTime && flight.DepartureTime.format('HH:mm')}</Text>
                        <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 13 }}>{flight.DepartureTime && flight.DepartureTime.format('MM-dd')} {flight.DepartureTime.getWeek()}</Text>
                        <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 13 }}>{Util.Parse.isChinese() ? flight.DepartureAirportName : flight.DepartureAirport}</Text>
                    </View>
                    <View style={{alignItems:'center',justifyContent:'center'}}>
                        <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 10 }}>{flight.FlightTotalTime && flight.FlightTotalTime.replace(':', 'h') + 'm'}</Text>
                        <Image style={[{ height: 15, width: 60 }, isFrom ? null : { tintColor: Theme.theme }]} source={require('../../res/image/intl_flight_icon.png')} />
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text allowFontScaling={false} style={{ fontSize: 20 }}>{flight.DestinationTime && flight.DestinationTime.format('HH:mm')}</Text>
                        <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 13 }}>{flight.DestinationTime && flight.DestinationTime.format('MM-dd')} {flight.DestinationTime.getWeek()}</Text>
                        <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 13 }}>{Util.Parse.isChinese() ? flight.DestinationAirportName : flight.DestinationAirport}</Text>
                    </View>
                </View>
            </View>
        );
    }

    _renderFlights = (flights, isFrom) => {
        if (flights && flights.length > 0) {
            return flights.map((item, index) => {
                return this._renderFlightDetail(item, index, isFrom);
            });
        }
        return null;
    }

    /**
     *  显示规改规则
     */
     _showRules = (index) => {
        if(index===1){
            this.refs.policy.show(this.state.order)
        }else{
            this.refs.policy2.show(this.state.order)
        }
    }

    _renderJourneyDetail = () => {
        const { showJourneyDetail, order } = this.state;
        const { AirList, PriceList } = order;
        let owJourney = { list: [] };
        let rtJourney = { list: [] };
        let lastDate = null;
        AirList.forEach(journey => {
            if (journey.RouteType === 22) {
                rtJourney.list.push(journey);
            } else {
                owJourney.list.push(journey);
            }
        });
        owJourney.list.forEach((flight, index) => {
            if (index === 0) {
                owJourney.Departure = flight.Departure;
                owJourney.Destination = flight.Destination;
                owJourney.DepartureTime = flight.DepartureTime;
                lastDate = flight.DestinationTime;
            } else {
                if (index === owJourney.list.length - 1) {
                    owJourney.Destination = flight.Destination;
                    // owJourney.DestinationTime = flight.DestinationTime;
                }
                flight.transferTime = IntlFlightService.getTransferTime(lastDate, flight.DepartureTime);
                lastDate = flight.DestinationTime;
            }
        });
        rtJourney.list.forEach((flight, index) => {
            if (index === 0) {
                rtJourney.Departure = flight.Departure;
                rtJourney.Destination = flight.Destination;
                rtJourney.DepartureTime = flight.DepartureTime;
                lastDate = flight.DestinationTime;
            } else {
                if (index === rtJourney.list.length - 1) {
                    rtJourney.Destination = flight.Destination;
                    // rtJourney.DestinationTime = flight.DestinationTime;
                }
                flight.transferTime = IntlFlightService.getTransferTime(lastDate, flight.DepartureTime);
                lastDate = flight.DestinationTime;
            }
        });
        order.owJourney = owJourney
        order.rtJourney = rtJourney
        return(
            <DetailHeaderView order={order} showRules={(index)=>this._showRules(index)}  _ruleReasonShow={this._ruleReasonShow} otwThis={this}/> 
        )
        // return (
        //     <View style={{ backgroundColor: Theme.theme, padding: 5 }}>
        //         <View style={{ backgroundColor: 'white', borderRadius: 3 }}>
        //             {
        //                 owJourney.list.length > 0 ? (
        //                     <TouchableHighlight onPress={() => this.setState({ showJourneyDetail: !showJourneyDetail })} underlayColor='transparent'>
        //                         <View style={{ padding: 5, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', borderBottomColor: Theme.lineColor, borderBottomWidth: 1 }}>
        //                             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        //                                 <View style={{ backgroundColor: Theme.theme, padding: 1 }}>
        //                                     <CustomText style={{ fontSize: 13, color: 'white' }} text='去' />
        //                                 </View>
        //                                 <Text allowFontScaling={false} style={{ marginLeft: 5 }}>{owJourney.DepartureTime && owJourney.DepartureTime.format('MM-dd')} {owJourney.DepartureTime.getWeek()} {owJourney.Departure}-{owJourney.Destination}</Text>
        //                             </View>
        //                             <View style={{ justifyContent: 'center' }}>
        //                                 <Ionicons name={showJourneyDetail ? 'chevron-up' : 'chevron-down'} size={24} color={'gray'} style={{ marginRight: 5 }} />
        //                             </View>
        //                         </View>
        //                     </TouchableHighlight>
        //                 ) : null
        //             }
        //             {
        //                 showJourneyDetail ? this._renderFlights(owJourney.list, true) : null
        //             }
        //             {
        //                 rtJourney.list.length > 0 ? (
        //                     <View style={{ padding: 5, flexDirection: 'row', justifyContent: 'space-between', borderBottomColor: Theme.lineColor, borderBottomWidth: 1 }}>
        //                         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        //                             <View style={{ backgroundColor: Theme.specialColor2, padding: 1 }}>
        //                                 <CustomText style={{ fontSize: 13, color: 'white' }} text='回' />
        //                             </View>
        //                             <Text allowFontScaling={false} style={{ marginLeft: 5 }}>{rtJourney.DepartureTime && rtJourney.DepartureTime.format('MM-dd')} {rtJourney.DepartureTime.getWeek()} {rtJourney.Departure}-{rtJourney.Destination}</Text>
        //                         </View>
        //                     </View>
        //                 ) : null
        //             }
        //             {
        //                 showJourneyDetail ? (
        //                     showJourneyDetail ? this._renderFlights(rtJourney.list, false) : null
        //                 ) : null
        //             }
        //             <View style={{ padding: 5, flexDirection: 'row', justifyContent: 'space-between' }}>
        //                 <View style={{ justifyContent: 'center' }}>
        //                     <Text allowFontScaling={false} style={{ color: Theme.annotatedFontColor, fontSize: 13 }}>{I18nUtil.translate('机票价')}：¥{PriceList[0].Price}    {I18nUtil.translate('税费')}：¥{PriceList[0].Tax}</Text>
        //                 </View>
        //                 <TouchableOpacity onPress={() => this.refs.policy.show()}>
        //                     <CustomText style={{ color: '#6DC17F', fontSize: 13 }} text='查看退改签' />
        //                 </TouchableOpacity>
        //             </View>
        //         </View>
        //     </View>
        // );
    }
}