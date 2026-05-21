import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TouchableHighlight,
    Image,
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
import { connect } from 'react-redux';
import OpenGetFile from '../../service/OpenGetFile';
/**
 * 国际机票改签申请
 */
class InflFlightOrderReissueScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title:'改签申请',
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
            // hide:true,
        }
        this.state = {
            /**
             * 加载中
             */
            showLoading: true,
            /**
             * 显示行程详情
             */
            showJourneyDetail: false,
            /**
             * 显示航班选择项
             */
            showSelectFlight: true,
            /**
             * 显示选择原因项
             */
            showSelectReason: true,
            /**
             * 已选择航班
             */
            selectedFlight: null,
            /**
             * 已选择原因
             */
            selectedReason: null,
            /**
             * 已选择乘客
             */
            selectedPassenger: [],
            /**
             * 意向出战日期
             */
            outboundTime: null,
            /**
             * 意向入站日期
             */
            inboundTime: null,
            /**
             * 意向描述
             */
            purposeDesc: null,
            /**
             * 订单详情
             */
            order: null,

            options: [ '行程改变', '航班变动', '其他'],

            otherReason: '',
            customerInfo: null,
            fileList: [],
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
        UserInfoDao.getCustomerInfo().then(customerInfo => {
            if (customerInfo) {
                this.setState({ customerInfo });
            }
        })
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


    _alertBtnClick = () => {
        this.setState({ alertShowing: false }, () => {
            this.navReset(['Home', 'IntlFlightOrderList'], null, 1);
        });
    }

    /**
     * 选择日期
     */
    _selectDate = (isFrom) => {
        let curDate = isFrom ? this.state.inboundTime : this.state.outboundTime;
        if (!curDate) {
            curDate = new Date();
        }
        this.push('Calendar', {
            navTitle: isFrom ? '意向去程日期' : '意向回程日期',
            beginDate: isFrom ? null : curDate,
            checkedDate: [curDate.format('yyyy-MM-dd')],
            backDate: (selectedDate) => {
                let date = Util.Date.toDate(selectedDate);
                if (date) {
                    if (isFrom) {
                        this.setState({ inboundTime: date});
                    } else {
                        this.setState({ outboundTime: date });
                    }
                }
            }
        });
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

    _goBack = () => {
        this.pop();
    }

    _orderReissue = () => {
        const { selectedFlight, selectedPassenger, selectedReason, purposeDesc, outboundTime, inboundTime, order, fileList,customerInfo } = this.state;
        if (!selectedFlight) {
            this.toastMsg('请选择要改签的航班');
            return;
        }
        if (selectedPassenger.length === 0) {
            this.toastMsg('请选择乘机人');
            return;
        }
        if (!selectedReason) {
            this.toastMsg('请选择改签原因');
            return;
        } 
        // else {
        //     if (!this.state.otherReason) {
        //         this.toastMsg('请填写改签的其他原因');
        //         return;
        //     }
        // }
        if (selectedFlight.name === '去程' && !inboundTime) {
            this.toastMsg('请选择去程意向日期');
            return;
        }
        if (selectedFlight.name === '回程' && !outboundTime) {
            this.toastMsg('请选择回程意向日期');
            return;
        }
        if (selectedFlight.name === '往返') {
            if (!inboundTime) {
                this.toastMsg('请选择去程意向日期');
                return;
            }
            if (!outboundTime) {
                this.toastMsg('请选择回程意向日期');
                return;
            }
        }
        if (outboundTime && inboundTime && outboundTime < inboundTime) {
            this.toastMsg('意向回程日期不能小于去程日期');
            return;
        }
        if (!purposeDesc) {
            this.toastMsg('请填写意向描述');
            return;
        }
        if(customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.IntlAirRessieNecessary){
            if(fileList.length===0){
                this.toastMsg('请上传附件');
                return;
            }
        }
        let airList = null;
        if (selectedFlight.name === '去程') {
            airList = Util.Encryption.clone(this.fromList);
        } else if (selectedFlight.name === '回程') {
            airList = Util.Encryption.clone(this.toList);
        } else if (selectedFlight.name === '往返') {
            airList = Util.Encryption.clone(order.AirList);
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
        let AttachmentModel = {
            AttachmentItems:fileList
        }
        let model = {
            OrderId: order.Id,
            ReasonCode: selectedReason.code,
            ReasonDesc: this.state.otherReason,
            PassengerList: selectedPassenger,
            AirList: airList,
            PurposeDesc: purposeDesc,
            Customer: this.customer,
            CustomerEmployee: this.customerEmployee,
            Platform: Platform.OS,
            OrderAttachment:AttachmentModel
        };
        if (inboundTime && selectedFlight.name !== '回程') {
            model.PurposeOutboundTime = inboundTime.format('yyyy-MM-dd');
        }
        if (outboundTime && selectedFlight.name !== '去程') {
            model.PurposeInboundTime = outboundTime.format('yyyy-MM-dd');
        }
        this.showLoadingView();
        IntlFlightService.orderReissue(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                this.showAlertView('提交改签成功', () => {
                    return ViewUtil.getAlertButton('确定', () => {
                        this.dismissAlertView();
                        DeviceEventEmitter.emit('goHome', {});
                        this.pop();
                    })
                })
            } else {
                this.toastMsg(response.message || '提交改签失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '提交改签异常');
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
        const { order,fileList } = this.state;
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
                        <CustomText text={'改签申请'} style={{fontSize:16, color:'#fff'}} />
                        <CustomText style={{fontSize:16, color:'#fff'}} text={''}></CustomText>
                    </View> */}
                    <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
                    >
                        <View style={{marginHorizontal:10,marginTop:-10}}>
                            {this._renderJourneyDetail()}
                            {this._renderSelectFlight()}
                            {this._renderSelectPassenger()}
                            {this._renderPurpose()}
                            {this._renderSelectReason()}
                            {this._renderUpFile()}
                            {
                            fileList.map((item,index)=>{
                                    return(
                                        <View style={{ flexDirection: 'row', height: 44, alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 20,justifyContent:'space-between',borderRadius:4}}>
                                            <CustomText text={item.FileName}></CustomText>                 
                                            <AntDesign name={'delete'} onPress={()=>{
                                                fileList.splice(index,1);
                                                this.setState({})
                                            }} size={22} color={Theme.theme} />
                                        </View>  
                                    )
                                })
                            }
                        </View>
                        <CustomActioSheet ref={o => this.actionSheet = o} options={this.state.options}  onPress={this._selectReason}/>
                        <View style={{height:20}}></View>
                    </KeyboardAwareScrollView>
                    <PolicyView ref='policy' order={order} />
                    <PolicyView2 ref='policy2' order={order} />
                </LinearGradient>
                {ViewUtil.getTwoBottomBtn('重新选择',this._goBack,'确定改签',this._orderReissue)}
            </View>
        );
    }

    _renderUpFile = () => {
        const { customerInfo } = this.state;
        return(
            customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.IntlAirRessieContainsAttachment//判断上传附件是否展示
            ?
            <View style={{marginTop:10,backgroundColor:'#fff',paddingHorizontal:20,borderRadius:6,paddingVertical:10}}>
                 <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between', backgroundColor:'#fff' , borderColor: Theme.lineColor, borderBottomWidth:1,flexWrap:'wrap'}}>
                        {
                            customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.IntlAirRessieNecessary?
                            <View style={{flexDirection:'row'}}>
                            <TitleView2 required={true} title={'上传附件'}  style={{}}></TitleView2>
                            </View>
                            :
                            <View style={{flexDirection:'row'}}>
                            <TitleView2  title={'上传附件'}  style={{paddingVertical:10}}></TitleView2>
                            </View>
                        }
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "space-between" }}>
                            <TouchableOpacity style={{ borderColor: Theme.theme,height: 25, borderWidth: 1,alignItems: 'center',justifyContent: "center",borderRadius: 3,paddingHorizontal:3}} 
                                onPress={()=>{
                                    this._selectFile()
                                }}
                            >
                                <CustomText text='从文件夹上传' style={{color: Theme.theme }} />
                            </TouchableOpacity>
                            {Platform.OS === 'android'?null:
                                <TouchableOpacity style={{ borderColor: Theme.theme ,marginLeft:5, height: 25, borderWidth: 1,alignItems: 'center',justifyContent: "center",borderRadius: 3,paddingHorizontal:3}} 
                                    onPress={()=>{
                                    this._selectImage()
                                    }}
                                >
                                    <CustomText text='打开相册或相机' style={{color: Theme.theme }} />
                                </TouchableOpacity>}
                        </View>
                        {/* <Ionicons name={'chevron-forward'} size={22} color={'lightgray'} style={{ marginLeft: 5 }} /> */}
                </View>
                <View style={{ backgroundColor: 'white',justifyContent:'space-between',marginTop:10}}>
                        <CustomText text={'单个文件最大5MB，数量最多5个，格式为:'} style={{fontSize:11, color:'red'}} ></CustomText>
                        <CustomText text={'jpg,png,jpeg,bmp,gif,xlsx,xls,txt,doc,docx,md,pdf,ppt,pptx,wps;'} style={{fontSize:11, color:'red'}}></CustomText>                                  
                </View>
            </View>
            :null
        )  
    }

    _selectFile=()=>{
        const {fileList} = this.state;
        if(fileList.length>4){
            this.toastMsg('最多只能上传5个文件')
            return;
        }
        OpenGetFile.getFile(this).then(response => {
            if (!response) {
                return;
            }
            fileList.push(response);
            this.setState({
                fileList:fileList
            })
        })
    }

    _selectImage=()=>{
        const {fileList} = this.state;
        if(fileList&&fileList.length>4){
            this.toastMsg('最多只能上传5个文件')
            return;
        }
        OpenGetPic.getFile(this).then(response => {
            response.data[0].FileName =  response.data[0].Name
            fileList.push(response.data[0]);
            this.setState({
                fileList:fileList,
                ImageInfo: response.imageInfo
            })
        })
    }

    _renderPurposeDate = () => {
        const { purposeDesc, inboundTime, outboundTime, selectedFlight } = this.state;
        if (selectedFlight) {
            return (
                <View style={{ marginHorizontal: 10,paddingVertical: 10, borderTopColor: Theme.lineColor, borderTopWidth: 1 }}>
                    {
                        selectedFlight.name === '去程' || selectedFlight.name === '往返' ? (
                            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'flex-end' ,paddingVertical:5,justifyContent:'space-between',borderBottomWidth:1,borderColor:Theme.lineColor,paddingBottom:15,paddingLeft:15}} onPress={() => this._selectDate(true)}>
                                <View style={{flexDirection:'row'}}>
                                    <CustomText style={{ color: Theme.annotatedFontColor }} text={inboundTime ? inboundTime.format('yyyy-MM-dd') : '请选择去程日期'} />
                                    <Text allowFontScaling={false} style={{ fontSize: 13, color: Theme.aidFontColor }}>{inboundTime ? inboundTime.getWeek() : ''}</Text>
                                </View>    
                                <AntDesign name={'right'} size={16} color={Theme.assistFontColor} style={{ }} />
                            </TouchableOpacity>
                        ) : null
                    }
                    {
                        selectedFlight.name === '回程' || selectedFlight.name === '往返' ? (
                            <TouchableOpacity style={{ flexDirection: 'row',paddingVertical:5,justifyContent:'space-between',borderBottomWidth:1,borderColor:Theme.lineColor,paddingBottom:15,paddingLeft:15}} onPress={() => this._selectDate(false)}>
                                <View style={{flexDirection:'row'}}>
                                <CustomText style={{ color: Theme.annotatedFontColor }} text={outboundTime ? outboundTime.format('yyyy-MM-dd') : '请选择回程日期'} />
                                <Text allowFontScaling={false} style={{ fontSize: 13, color: Theme.aidFontColor }}>{outboundTime ? outboundTime.getWeek() : ''}</Text>
                                </View>
                                <AntDesign name={'right'} size={16} color={Theme.assistFontColor} style={{ }} />
                            </TouchableOpacity>
                        ) : null
                    }
                </View>
            );
        } else {
            return (
                <View style={{ marginHorizontal: 10, paddingVertical: 10, borderTopColor: Theme.lineColor, borderTopWidth: 1 }}>
                    {
                        this.fromList.length > 0 ? (
                            <TouchableOpacity style={{flexDirection: 'row', alignItems: 'flex-end',paddingVertical:5,justifyContent:'space-between',borderBottomWidth:1,borderColor:Theme.lineColor,paddingBottom:15,paddingLeft:15}} onPress={() => this._selectDate(true)}>
                                <View style={{flexDirection:'row'}}>
                                <CustomText style={{ color: Theme.annotatedFontColor }} text={inboundTime ? inboundTime.format('yyyy-MM-dd') : '请选择去程日期'} />
                                <Text allowFontScaling={false} style={{ fontSize: 13, color: Theme.aidFontColor }}>{inboundTime ? inboundTime.getWeek() : ''}</Text>
                                </View>
                                <AntDesign name={'right'} size={16} color={Theme.assistFontColor} style={{ }} />
                            </TouchableOpacity>
                        ) : null
                    }
                    {
                        this.toList.length > 0 ? (
                            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'flex-end',paddingVertical:5,justifyContent:'space-between',borderBottomWidth:1,borderColor:Theme.lineColor,paddingBottom:15,paddingLeft:15}} onPress={() => this._selectDate(false)}>
                                <View style={{flexDirection:'row',paddingTop:5}}>
                                    <CustomText style={{ color: Theme.annotatedFontColor }} text={outboundTime ? outboundTime.format('yyyy-MM-dd') : '请选择回程日期'} />
                                    <Text allowFontScaling={false} style={{ fontSize: 13, color: Theme.aidFontColor }}>{outboundTime ? outboundTime.getWeek() : ''}</Text>
                                </View>
                                <AntDesign name={'right'} size={16} color={Theme.assistFontColor} style={{ }} />
                            </TouchableOpacity>
                        ) : null
                    }
                </View>
            );
        }
    }

    /**
     * 渲染意向信息
     */
    _renderPurpose = () => {
        return (
            <View style={{ backgroundColor: 'white', marginTop: 10,padding: 10,borderRadius:6 }}>
                <View style={{ padding:10 }}>
                    <TitleView2 title='意向日期选择'></TitleView2>
                </View>
                {this._renderPurposeDate()}
                <CustomTextInput style={{ height: 50, borderColor: Theme.aidFontColor, borderWidth: 0.5, fontSize: 13, marginHorizontal: 10, marginBottom: 10,borderRadius:3,paddingHorizontal: 10 }} 
                                 placeholderTextColor={Theme.aidFontColor} 
                                 placeholder={'请输入意向描述'} maxLength={125} 
                                 multiline={true} 
                                 onChangeText={purposeDesc => this.setState({ purposeDesc })} blurOnSubmit={true} 
                                 returnKeyType='done' />
            </View>
        );
    }

    _renderSelectFlight = () => {
        const { showSelectFlight, selectedFlight } = this.state;
        return (
            <View style={{ backgroundColor: 'white', marginTop: 10,borderRadius:6,paddingHorizontal:10 }}>
                <View style={{ padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TitleView2 title='选择改签航班'></TitleView2>
                    {/* <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} >
                        <CustomText style={{ color: Theme.aidFontColor, fontSize: 13 }} text='请选择' />
                        <AntDesign name={'right'} size={16} color={Theme.assistFontColor} style={{ }} />
                    </TouchableOpacity> */}
                </View>
                {
                    this.flightItems.map((item, index) => (
                        <TouchableHighlight key={index} underlayColor='#f4f4f4' onPress={() => this.setState({ selectedFlight: item, showSelectFlight: false })}>
                            <View style={{  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',padding: 10, }}>
                                <View style={{   flexDirection: 'row' }}>
                                    <CustomText style={{ color: Theme.commonFontColor, fontSize: 13 }} text={item.name} />
                                    <CustomText style={{ color: Theme.commonFontColor, fontSize: 13, marginLeft: 20 }} text={item.text} />
                                </View>
                                <CheckBox
                                    isChecked={this.state.selectedFlight === item}
                                    onClick={() => this.setState({ selectedFlight: item, showSelectFlight: false })}
                                />
                            </View>
                        </TouchableHighlight>
                    ))
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
            <View style={{ backgroundColor: 'white', marginTop: 10,borderRadius:6,padding:10}}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',marginHorizontal:10,paddingVertical:10 }}>
                   <TitleView2 title='选择乘机人'></TitleView2>
                </View>
                {
                    passengerList.map((passenger, index) => (
                        <TouchableHighlight key={index} onPress={() => this._selectPassenger(passenger)} underlayColor='#f4f4f4'>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopColor: Theme.lineColor, borderTopWidth: 1,marginHorizontal:10,paddingVertical:10}}>
                                <View style={{ justifyContent: 'center' }}>
                                    <Text allowFontScaling={false} style={{ color: Theme.commonFontColor, fontSize: 13 }}>{passenger.Name}</Text>
                                    {
                                        passenger.Certificate ? (
                                            <Text allowFontScaling={false} style={{ marginTop: 5, color: Theme.commonFontColor, fontSize: 13 }}>{I18nUtil.translate(passenger.Certificate.TypeDesc)}：{Util.Read.simpleReplace(passenger.Certificate.SerialNumber)}</Text>
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
        const { showSelectReason, selectedReason } = this.state;

        return (
            <View style={{ backgroundColor: 'white', marginTop: 10,padding: 10,borderRadius:6 }}>
                <TouchableOpacity onPress={() => this.actionSheet.show()} style={{ marginHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',borderBottomWidth:1,borderBottomColor:Theme.lineColor,paddingVertical:10 }}>
                    <TitleView2 title='选择改签原因' required={true}></TitleView2>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {
                                selectedReason ? (
                                    <CustomText style={{ color: Theme.annotatedFontColor, fontSize: 13 }} text={selectedReason.reason ? selectedReason.reason : '其他原因'} />
                                ) : (
                                    <AntDesign name={'right'} size={16} color={Theme.assistFontColor} style={{ }} />
                                    )
                            }
                        </View>
                    </View>
                </TouchableOpacity>
             
                <CustomTextInput style={{ height: 50, borderColor: Theme.lineColor, borderWidth: 0.5, fontSize: 13, marginHorizontal: 10, borderColor: Theme.aidFontColor, marginBottom: 10,borderRadius:3,paddingHorizontal: 10 ,borderRadius:3,marginTop:10}} placeholderTextColor={Theme.aidFontColor} placeholder={'请输入改签原因'} maxLength={125} multiline={true} underlineColorAndroid={'transparent'} onChangeText={reason => {
                    // if (this.state.selectedReason.code === 3) {
                    //     this.state.selectedReason.reason = reason;
                    this.setState({ otherReason: reason });
                    // }
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
        let isChinese = Util.Parse.isChinese();
        if (flight.ShareAirlineCode && flight.ShareAirlineNumber) {
            shareTxt = I18nUtil.translate('实际承运') + '  ' + (Util.Parse.isChinese() ? flight.ShareAirlineName : Util.Read.domesticAirlines(flight.ShareAirlineCode)) + flight.ShareAirlineCode + flight.ShareAirlineNumber;
            // shareTxt = `实际共享航班 ${flight.ShareAirlineName} ${flight.ShareAirlineCode}${flight.ShareAirlineNumber}`;
        }
        return (
            <View key={index} style={{ borderBottomColor: Theme.lineColor, borderBottomWidth: 1, padding: 5 }}>
                <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 13 }}>{isChinese ? flight.AirlineName : ''}{flight.AirlineCode}{flight.AirlineNumber}  {isChinese ? flight.CabinName : flight.CabinCode + ' '}{flight.ServiceCabin}  {shareTxt}</Text>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ flex: 1 }}>
                        <Text allowFontScaling={false} style={{ fontSize: 20 }}>{flight.DepartureTime && flight.DepartureTime.format('HH:mm')}</Text>
                        <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 13 }}>{flight.DepartureTime && flight.DepartureTime.format('MM-dd')} {flight.DepartureTime.getWeek()}</Text>
                        <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 13 }}>{isChinese ? flight.DepartureAirportName : flight.DepartureAirport}</Text>
                    </View>
                    <View style={{alignItems:'center',justifyContent:'center'}}>
                        <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 10 }}>{flight.FlightTotalTime && flight.FlightTotalTime.replace(':', 'h') + 'm'}</Text>
                        <Image style={[{ height: 15, width: 60 }, isFrom ? null : { tintColor:Theme.theme }]} source={require('../../res/image/intl_flight_icon.png')} />
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text allowFontScaling={false} style={{ fontSize: 20 }}>{flight.DestinationTime && flight.DestinationTime.format('HH:mm')}</Text>
                        <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 13 }}>{flight.DestinationTime && flight.DestinationTime.format('MM-dd')} {flight.DestinationTime.getWeek()}</Text>
                        <Text allowFontScaling={false} style={{ color: Theme.aidFontColor, fontSize: 13 }}>{isChinese ? flight.DestinationAirportName : flight.DestinationAirport}</Text>
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
            // this.policyView.show(this.state.order);
            this.refs.policy.show(this.state.order)
        }else{
            // this.policyView2.show(this.state.order);
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
    }
}
const getStatePorps = state => ({
    comp_userInfo: state.comp_userInfo,
})
export default connect(getStatePorps)(InflFlightOrderReissueScreen);
