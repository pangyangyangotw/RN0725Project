import React from 'react';
import {
    View,
    StyleSheet,
    TouchableHighlight,
    FlatList,
    DeviceEventEmitter,
    Image
} from 'react-native';
import SuperView from '../../super/SuperView';
import CustomText from '../../custom/CustomText';
import ViewUtil from '../../util/ViewUtil';
import Theme from '../../res/styles/Theme';
import ApplicationService from '../../service/ApplicationService';
import CustomActionSheet from '../../custom/CustomActionSheet';
import { connect } from 'react-redux';
import UserInfoDao from '../../service/UserInfoDao';
import Util from '../../util/Util';
import CommonService from '../../service/CommonService';
import TitleSwitchView from '../common/TitleSwitchView';


class PayListScreen extends SuperView {
    constructor(props) {
        super(props);
        this._navigationHeaderView = {
            title: '支付列表',
        }
        this._tabBarBottomView = {
            bottomInset: true
        }
        this.state = {
            dataList: [],
            page: 1,
            keyWord: '',
            isLoading: true,
            isLoadingMore: false,
            isNoMoreData: false,
            selectApply: null,
            options: ['国内机票', '港澳台及国际机票', '火车票', '国内酒店', '港澳台及国际酒店', '用车'],
            startCity:'',
            arrivalCity:'',
            EnableCreateTravelApply:true,
            Departure1:null,
            Destination1:null,
            J_index:0,
            customerInfo:null,
            PaymentStatus:["1"],
            userInfo: null,
        }
    }
   
    componentDidMount() {
        UserInfoDao.getUserInfo().then(userInfo => {
            this.setState({
                userInfo:userInfo
            })
        })
        this._loadList();
       
        // UserInfoDao.getCustomerInfo().then(customerInfo => {
        //     if(customerInfo){
        //        this.setState({ customerInfo:customerInfo,})
        //     }
        //     if(!customerInfo|| !customerInfo.Setting || !customerInfo.Setting.EnableCreateTravelApply){
        //     this.setState({
        //         EnableCreateTravelApply:false,
        //     })
        //   }
        // }) 
    }

    componentWillUnmount(){    
    };

    _loadList = () => {
        let model = {
            query: {
                PaymentStatus: this.state.PaymentStatus
            }, 
            pagination: {
                PageIndex: this.state.page,
                PageSize: 10
            }
        }
        this.showLoadingView();
        CommonService.PaymentAllList(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if (response.data && response.data.ListData) {
                    this.state.dataList = this.state.dataList.concat(response.data.ListData);
                }
                if (response.data.TotalRecorder <= this.state.dataList.length) {
                    this.state.isNoMoreData = true;
                }
                this.setState({
                    isLoading: false,
                    isLoadingMore: false
                })
            } else {
                this._detailLoadFail();
                this.toastMsg(response.message || '获取申请单列表失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this._detailLoadFail();
            this.toastMsg(error.message || '获取数据异常');
        })
    }
      //错误处理
      _detailLoadFail = () => {
        if (this.state.isLoadingMore) {
            this.state.page--;
        }
        this.setState({
            isLoading: false,
            isLoadingMore: false
        })
    }

    //前往订单详情
    _toOrderDetail = (data) => {
        let model ={
            Id:data.Id,//综合订单id
         } 
         this.showLoadingView();
         CommonService.PaymentSerialNumberList(model).then(response => {
             this.hideLoadingView();
             if (response && response.success) {
                    let options = [];
                    let optionsItem = [];
                    response.data.data.map((item,index)=>{
                        options.push(
                            item.SerialNumber
                        )
                        optionsItem.push(
                            item
                        )
                    })
                    this.setState({
                        options:options,
                        optionsItem:optionsItem,
                    },()=>{
                        this.actionSheet.show();
                    })
             } else {
                 this.toastMsg(response.message);
             }
         }).catch(error => {
             this.hideLoadingView();
             this.toastMsg(error.message);
         })
    }

    /**
     * 催审
     * @param {*} item 
     */
    _cuishenClick=(item)=>{
        let model ={
            ApplyId:item.Id,//综合订单id
         } 
         this.showLoadingView();
         CommonService.TravelApplyUrgeApproval(model).then(response => {
             this.hideLoadingView();
             if (response && response.success) {
                 this.toastMsg('催审成功');
             } else {
                 this.toastMsg(response.message);
             }
         }).catch(error => {
             this.hideLoadingView();
             this.toastMsg(error.message);
         })
     }
    /**
     * 撤回审批
     */
    _callBackApproval = (item) => {
        let model ={
            applyId:item.Id,//综合订单id
        } 
        this.showLoadingView();
        ApplicationService.TravelApplyWithdrawnApproval(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) { 
                this.showAlertView('申请单已成功撤回。', () => {
                    return ViewUtil.getAlertButton('确定', () => {
                        this.dismissAlertView();
                        this.setState({
                            page: 1,
                            isLoadingMore: false,
                            isNoMoreData: false,
                            isLoading: true,
                            dataList: []
                        }, () => {
                            this._loadList();
                        })
                    })
                }); 
            } else {
                this.toastMsg(response.message);
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message);
        })
    }
   
    _handlePress = (index,data) => {
        const {optionsItem,userInfo} = this.state;
        // 1国内机票， 4国内酒店，6国际酒店，7国际机票， 5火车，13综合
        if(optionsItem[index].Category===1){
            this.push('FlightOrderDetail', {
                Id: optionsItem[index].Id,
                userInfoId:userInfo.Id
            })
        }else if(optionsItem[index].Category===4){
            this.push('HotelOrderDetailScreen', {
                OrderId: optionsItem[index].Id,
            })
        }else if(optionsItem[index].Category===6){
            this.push('InterHotelOrderDetail', {
                orderId: optionsItem[index].Id,
            })
        }
        else if(optionsItem[index].Category===7){
            this.push('IntlFlightOrderDetail', {
                order: optionsItem[index].Id,
            })
        }else if(optionsItem[index].Category===5){
            this.push('TrainOrderDetailScreen', {
                Id: optionsItem[index].Id,
            })
        }else if(optionsItem[index].Category===13){
            this.push('CompDetailScreen', {
                orderId: optionsItem[index].Id,
            })
        }
    }

    /**
     *  切换按钮
     */
    _switchBtnCLick = (index) => {
        if (this.state.PaymentStatus === index) return;
        this.setState({
            page: 1,
            isLoadingMore: false,
            isNoMoreData: false,
            isLoading: true,
            dataList: [],
            PaymentStatus: index===2?[""]:["1"],  
        }, () => {
            this._loadList();
        })
    }

    renderBody() {
        const { dataList, isLoading, isLoadingMore, isNoMoreData, options, keyWord } = this.state;
        return (
            <View style={{ flex: 1 }}>
                <TitleSwitchView leftTitle='待支付' rightTitle='全部' callBack={this._switchBtnCLick} />
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={dataList}
                        renderItem={this._renderItem}
                        showsVerticalScrollIndicator={false}
                        refreshControl={ViewUtil.getRefreshControl(isLoading, () => {
                            this.setState({
                                page: 1,
                                isLoading: true,
                                isNoMoreData: false,
                                isLoadingMore: false,
                                dataList: []
                            }, () => {
                                this._loadList();
                            })
                        })}
                        keyExtractor={(item, index) => String(index)}
                        onEndReachedThreshold={0.1}
                        ListFooterComponent={ViewUtil.getRenderFooter(isLoadingMore, isNoMoreData)}
                        onEndReached={() => {
                                if (this.canLoad && !isNoMoreData && !isLoadingMore && !isLoading) {
                                    this.state.page++;
                                    this.setState({
                                        isLoadingMore: true
                                    }, () => {
                                        this._loadList();
                                        this.canLoad = false;
                                    })
                                }
                        }}
                        onMomentumScrollBegin={() => {
                            this.canLoad = true
                        }}
                    />
                    <CustomActionSheet ref={o => this.actionSheet = o} options={options} onPress={this._handlePress} />
                </View>
            </View>
        )
    }
    
    /**
     *  取消订单
     */
    _paymentCancel = (item, index) => {
        this.showAlertView('确定要取消支付吗？', () => {
            return ViewUtil.getAlertButton('我再想想', () => {
                this.dismissAlertView();
            }, '确定', () => {
                this.dismissAlertView();
                this.showLoadingView();
                let model = {
                    SerialNumber: item.SerialNumber
                }
                CommonService.PaymentCancel(model).then(response => {
                    this.hideLoadingView();
                    if (response && response.success) {
                        this.state.dataList.splice(index, 1);
                        this.setState({});
                        this.toastMsg('取消支付成功');
                    } else {
                        this.toastMsg(response.message || '取消支付失败');
                    }
                }).catch(error => {
                    this.hideLoadingView();
                    this.toastMsg(error.message || '取消订单异常');
                })
            })
        })
    }

    /**
     *  直接支付
     */
    _toPay = (data) => {
       if(data.Category===17){
        this.push('CompPaymentScreen',{TradeNumber:data.SerialNumber})
        return;
       }else if(data.Category===12 || data.Category===1){
        this.push('FlightPayment', {SerialNumber:data.SerialNumber});
       }else if(data.Category===6){
        this.push('IntlFlightPayment', { SerialNumber: data.SerialNumber });
       }else if(data.Category===5 || data.Category===20){
        this.push("TrainPayment",{SerialNumber:data.SerialNumber})
       }else if(data.Category===3){
        this.push('HotelPayment', { SerialNumber: data.SerialNumber,Id:data.Id,from:'hotel' });
       }else if(data.Category===4){
        this.push('HotelPayment', { SerialNumber: data.SerialNumber,Id:data.Id,from:'inthotel' });
       }
    }
    _renderItem = ({ item: data, index }) => {
        return (
            <TouchableHighlight underlayColor='transparent' onPress={this._toOrderDetail.bind(this, data)}>
                <View style={{ backgroundColor: 'white', marginTop: 10 ,marginHorizontal:10, borderRadius:6}}>
                    <View style={{ paddingHorizontal:20, paddingVertical:10}}>
                        <View style={{flexDirection:'row',justifyContent: "space-between",borderBottomWidth:1,borderColor:Theme.lineColor,paddingVertical:10}}>
                            <View style={{flexDirection:'row'}}>
                                <Image source={ require('../../res/Uimage/bag.png')} style={{ width: 18, height: 18 }}></Image>
                                <CustomText style={{ color: Theme.commonFontColor,marginLeft:8,fontWeight:'bold' }} text={'查看订单'} />
                            </View>
                            <CustomText style={{ color:data.PaymentStatus===4||data.PaymentStatus===2?Theme.aidFontColor: Theme.theme }} text={'¥ '+data.Amount} />
                        </View>
                        <View style={{ flexDirection: "row",marginTop:10,flexWrap:'wrap',width:global.screenWidth-60 }}>
                            <CustomText numberOfLines={1} text={'创建时间'} style={{ fontSize:13 }} />
                            <CustomText numberOfLines={1} text={'：'} style={{ fontSize:13 }} />
                            <CustomText numberOfLines={1} text={formatDate(data.CreateTime)} style={{ fontSize:13 }} />
                        </View>
                        <View style={{ flexDirection: "row",marginTop:10,flexWrap:'wrap',width:global.screenWidth-60 }}>
                            <CustomText numberOfLines={1} text={'预订人'} style={{ fontSize:13 }} />
                            <CustomText numberOfLines={1} text={'：'} style={{ fontSize:13 }} />
                            <CustomText numberOfLines={1} text={data.EmployeeName} style={{ fontSize:13 }} />
                        </View>
                        {
                            data.PaymentStatus===4?null:
                            data.PaymentStatus===2?
                                <View style={{ flexDirection: "row",marginTop:10,flexWrap:'wrap',width:global.screenWidth-60,alignItems:'center' }}>
                                    <Image source={ require('../../res/Uimage/flightFloder/time_circle.png')} style={{ width: 15, height: 15, tintColor:Theme.redColor }}></Image>
                                    <CustomText numberOfLines={1} text={'支付完成'} style={{ fontSize:13, color:Theme.redColor }} />
                                    <CustomText numberOfLines={1} text={'：'} style={{ fontSize:13, color:Theme.redColor }} />
                                    <CustomText numberOfLines={1} text={formatDate(data.PaymentDate)} style={{ fontSize:13, color:Theme.redColor }} />
                                </View>
                            :
                            <View style={{ flexDirection: "row",marginTop:10,flexWrap:'wrap',width:global.screenWidth-60,alignItems:'center' }}>
                                <Image source={ require('../../res/Uimage/flightFloder/time_circle.png')} style={{ width: 15, height: 15, tintColor:Theme.redColor }}></Image>
                                <CustomText numberOfLines={1} text={'支付截至时间'} style={{ fontSize:13, color:Theme.redColor }} />
                                <CustomText numberOfLines={1} text={'：'} style={{ fontSize:13, color:Theme.redColor }} />
                                <CustomText numberOfLines={1} text={formatDate(data.PaymentLimit)} style={{ fontSize:13, color:Theme.redColor }} />
                            </View>
                        }
                        
                        {
                            data.PaymentStatus===4?
                                <View style={{flexDirection: "row-reverse", marginTop: 10,borderTopWidth:1,borderColor:Theme.lineColor,alignItems:'center',paddingTop:10 }}>
                                    <CustomText text={data.PaymentStatusDesc} style={{  }} />
                                </View>
                            :
                            data.PaymentStatus===2?
                                <View style={{flexDirection: "row-reverse", marginTop: 10,borderTopWidth:1,borderColor:Theme.lineColor,alignItems:'center',paddingTop:10 }}>
                                    <CustomText text={data.PaymentStatusDesc} style={{  }} />
                                </View>
                            :
                            <View style={{ flexDirection: "row-reverse", marginTop: 10,borderTopWidth:1,borderColor:Theme.lineColor,alignItems:'center',paddingTop:10 }}>
                                <TouchableHighlight underlayColor='transparent' onPress={() => this._paymentCancel(data, index)}>
                                    <View style={styles.btn2}>
                                        <CustomText text='取消支付' style={{ color: Theme.theme }} />
                                    </View>
                                </TouchableHighlight>
                                <TouchableHighlight underlayColor='transparent' onPress={() => this._toPay(data, index)}>
                                    <View style={styles.btn}>
                                        <CustomText text='立即支付' style={{ color: 'white' }} />
                                    </View>
                                </TouchableHighlight>
                            </View>
                        }
                    </View>
                </View>
            </TouchableHighlight>
        )
    }
}

const getProps = (state) => ({
    // apply: state.apply.apply,
    // feeType: state.feeType.feeType,
    // compSwitch:state.compSwitch.bool,
    // customerInfo_userInfo: state.customerInfo_userInfo,
});
const getActions = dispatch => ({
    // setApply: (value) => dispatch(Action.applySet(value)),
    // setFeeType: (value) => dispatch(Action.feeTypeTransform(value))
})
export default connect(getProps, getActions)(PayListScreen)

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = Util.Date.toDate(dateString);
    return date ? date.format('yyyy-MM-dd HH:mm') : '-';
};

const styles = StyleSheet.create({
    btn: {
        backgroundColor: Theme.theme,
        height: 22,
        marginLeft: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius:2,
        paddingHorizontal:15,       
    },
    btn2: {
        height: 22,
        marginLeft: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal:15,
        borderWidth:1,
        borderColor:Theme.theme,
        borderRadius:2       
    },
    
})