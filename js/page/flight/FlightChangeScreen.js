import React from 'react';
import {
    StyleSheet,
    View,
    Platform,
    DeviceEventEmitter,
    TouchableHighlight,
    TouchableOpacity,
    Image
} from 'react-native';
import SuperView from '../../super/SuperView';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import HeaderView from './HeaderView';
import FlightService from '../../service/FlightService';
import CustomText from '../../custom/CustomText';
import CustomActioSheet from '../../custom/CustomActionSheet';
import CustomeTextInput from '../../custom/CustomTextInput';
import { connect } from 'react-redux';
import ViewUtil from '../../util/ViewUtil';
import Key from '../../res/styles/Key';
import Theme from '../../res/styles/Theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RuleView from './RuleView';
import RuleView2 from './RuleView2';
import NavigationUtils from '../../navigator/NavigationUtils';
import I18nUtil from '../../util/I18nUtil';
import UserInfoDao from '../../service/UserInfoDao';
import CommonService from '../../service/CommonService';
import  LinearGradient from 'react-native-linear-gradient';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { TitleView2 } from '../../custom/HighLight';
import HighLight from '../../custom/HighLight';
import OpenGetFile from '../../service/OpenGetFile';
import Util from '../../util/Util';

class FlightChangeScreen extends SuperView {
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
            order: null,
            reasonDesc: '',
            reasonCode: '',
            inputReason: "",
            options: this.props.feeType === 1 ? ['因公司原因', '因航班变动', '因个人原因', '其他'] : ['因航班变动', '因个人原因', '其他'],
            fileList:[],
            ImageInfo:{},
        }
    }
    componentDidMount() {
        this.showLoadingView();
        let model={
            ReferenceEmployeeId:this.params.oldModelDetail.ReferenceEmployeeId,
            ReferencePassengerId:this.params.oldModelDetail.ReferencePassengerId
        }
        CommonService.customerInfo(model).then(customerInfo => {
            this.state.customerInfo = customerInfo.data;
            FlightService.orderDetail(this.params.oldData && this.params.oldData.Id).then(response => {
                this.hideLoadingView();
                if (response && response.success) {
                    this.setState({
                        order: response.data
                    }, () => {
                        this.getApprover(response.data);
                    })
                } else {
                    this.toastMsg(response.message || '获取订单详情失败');
                }
            }).catch(error => {
                this.hideLoadingView();
                this.toastMsg(error.message || '获取订单详情异常');
            })
        }).catch(error => {
            this.hideLoadingView();
        })
    }
    getApprover(order) {

        if (order.FeeType === 2) {
            return;
        }
        if (this.state.customerInfo && this.state.customerInfo.Setting && this.state.customerInfo.Setting.IsRescheduleApproval) {
            let approverInfo = {
                PassengerList: order.Travellers,
                ApproveOrigin: order.ApproveOrigin,
                BusinessType: 2,
                IsWorkflow: true,
                OrderId: order.Id,
                ReferenceEmployeeId:order.ReferenceEmployeeId,
                ReferencePassengerId:order.ReferencePassengerId,
            }
            this.showLoadingView();
            CommonService.ApproveInfo(approverInfo).then(response => {
                this.hideLoadingView();
                if (response && response.success) {
                    this.setState({
                        ApproverInfo: response.data ? response.data[0] : null
                    })
                } else {
                    this.toastMsg(response.message || '获取审批人信息失败');
                }
            }).catch(error => {
                this.hideLoadingView();
                this.toastMsg(error.message || '获取审批人信息异常');
            })
        }
    }



    _handlePress = (index) => {
        this.state.reasonDesc = this.state.options[index];
        switch (this.state.reasonDesc) {
            case '因公司原因':
                this.state.reasonCode = '1';
                break;
            case '因航班变动':
                this.state.reasonCode = '2';
                break;
            case '因个人原因':
                this.state.reasonCode = '4';
                break;
            case '其他':
                this.state.reasonCode = '0';
                break;
        }
        this.setState({});
    }
    /**
     *  选择改签原因
     */
    _selectReason = () => {
        this.actionSheet.show();
    }

    /**
     *  取消改签
     */
    _cancelChange = () => {
        this.pop();
    }
    /**
     *  提交改签
     */
    _submintChange = () => {
        const { oldData,oldModelDetail, newData } = this.params;
        const { reasonCode, inputReason, order,ApproverInfo,fileList,customerInfo } = this.state;
        if (!reasonCode) {
            this.toastMsg('请选择改签原因');
            return;
        }
        // if (!inputReason) {
        //     this.toastMsg('请输入原因');
        //     return;
        // }
        if(customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.AirRessieNecessary?customerInfo.Setting.AttachmentConfig.AirRessieNecessary:false){
            if(fileList.length==0){
                this.toastMsg('请上传附件');
                return;
            }
        }
       if(!newData){return};
        let lists = oldModelDetail?.OrderAir?.PolicySummary?.ReissuePolicy?.Details;
        let rescheduleCharge;
        let RefundChargeDesc;
        let currentDate = new Date();
        if(Array.isArray(lists)){
            try {
                lists.forEach(detailFee => {
                    if(detailFee){
                        let rulesData = new Date(detailFee.Timeline);
                        if (isNaN(rulesData)) return; // 跳过无效日期
                        if((Date.parse(currentDate) <= Date.parse(rulesData) && detailFee.TimelineType == 1) || (Date.parse(currentDate) >= Date.parse(rulesData) && detailFee.TimelineType == 3)){
                            rescheduleCharge = detailFee.Fee
                            if(rescheduleCharge === undefined || rescheduleCharge === null){
                                RefundChargeDesc = detailFee.FeeDesc;
                            }
                            throw new Error();
                        }
                    }
                })
            }catch(error){
            }
        }
        let approvalList = [];
        if(ApproverInfo?.WorkflowChooseOneOrAll){
            const steps = ApproverInfo.ApprovalModel?.Steps;
            if(Array.isArray(steps) && steps.length > 0 && order.MassOrderId){
                steps.map((item)=>{
                    if(item?.approvalPerson){
                        item.approvalPerson.DepartmentName = item.approvalPerson.extendtext
                        approvalList.push(item.approvalPerson);
                    }
                })
                if(steps.length > approvalList.length){
                    this.toastMsg('请选择审批人');
                    return;
                }
            }
        }
        this.showLoadingView();
        let model = {
            ReasonType: parseInt(this.state.reasonCode),
            Reason: this.state.inputReason,
            OldReissueId: oldData.CurReissueId,
            RescheduleCharge:rescheduleCharge,
            RefundChargeDesc:RefundChargeDesc,
            // TPM: data.TPM,
            // Stop: data.fltInfo.Stop,
            // SupplierType: data.SupplierType,
            OrderAir: {
                Departure: newData.DepartureCityName,
                Destination: newData.ArrivalCityName,
                DepartureAirport: newData.DepartureAirport,
                DestinationAirport: newData.ArrivalAirport,
                AirNumber: newData.FlightNumber,
                AirPlace: newData.ResBookDesigCode,
                DepartureTime: newData.DepartureTime,
                DestinationTime: newData.ArrivalTime,
                Airline: newData.AirCode,
                Price: newData.Price,
                Tax: newData.Tax,
                CnTax:newData.CnTax,
                YqTax:newData.YqTax,
                DepartureAirportName: newData.DepartureAirportDesc,
                DestinationAirportName: newData.ArrivalAirportDesc,
                AirlineName: newData.AirCodeDesc,
                EquipType: newData.AirEquipType,
                AirPlaceName: newData.ResBookDesinCodeDesc ? newData.ResBookDesinCodeDesc : '',
                EnAirPlaceName: newData.EnResBookDesinCodeDesc ? newData.EnResBookDesinCodeDesc : '',
                DepartureAirportTerminal: newData.DepartureAirPortTerminal,
                DestinationAirportTerminal: newData.ArrivalAirPortTerminal,
                Discount: newData.DiscountRate,
                ShareAirline: newData.fltInfo.codeShareLine,
                ShareAirlineName: newData.fltInfo.codeShareFltLineName,
                ShareAirNumber: newData.fltInfo.codeShareFltNo,
                FareBasis: newData.BigCompanyFareType,
                DiscountDesc: newData.DiscountRateDesc,
                AgencyFee: newData.AgencyFee,
                ServiceCabin: newData.ServiceCabin,
                DepartureCode: newData.DepartureCityCode,
                DestinationCode: newData.ArrivalCityCode,
                FlightId: newData.FlightId,
                SupplierFlightId: newData.SupplierFlightId,
                SupplierPriceId: newData.SupplierPriceId,
                DataId: newData.DataId,
                PriceId: newData.PriceId,
                AccountCode: newData.AccountCode,
                IsCompanyFarePrice: newData.IsCompanyFarePrice,
                CabinTag: newData.CabinTag,
                CabinTagDesc: newData.CabinTagDesc,
                ChannelTag: newData.ChannelTag,
                IssueTag: newData.IssueTag,
                IssueDesc: newData.IssueDesc,
                PolicySummary: newData.PolicySummary,
                ProductCabins: newData.ProductCabins,
                FareBasisCode: newData.FareBasisCode,
                TPM: newData.fltInfo && newData.fltInfo.TPM,
                Stop: newData.fltInfo && newData.fltInfo.Stop,
                MealCode: newData.fltInfo && newData.fltInfo.meal,
                MealDesc: newData.fltInfo && newData.fltInfo.MealDesc,
                SupplierType: newData.SupplierType,

            }
        }
        let AttachmentModel = {
            AttachmentItems:fileList
        }
        var changeInfo = {
            OrderId: oldData.Id,
            Platform: Platform.OS,
            RefundInfo: model,
            approvers:ApproverInfo&&ApproverInfo.WorkflowChooseOneOrAll?approvalList:null,
            OrderAttachment:AttachmentModel
        }

        FlightService.FlightOrderReissueFee(changeInfo).then(response => {
            this.hideLoadingView();
            if (response && response.success && response.data) {
                const { PriceDiff, TaxDiff, AdtCnTax, AdtYqTax } = response.data;
                changeInfo.RefundInfo.RescheduleCharge = response.data.ReissueFee
                if (TaxDiff == 0) {
                    changeInfo.RefundInfo.OrderAir.Tax = newData.Tax;
                    changeInfo.RefundInfo.OrderAir.CnTax = newData.CnTax;
                    changeInfo.RefundInfo.OrderAir.YqTax = newData.YqTax;
                  } else {
                    changeInfo.RefundInfo.OrderAir.Tax = newData.Tax + TaxDiff;
                    changeInfo.RefundInfo.OrderAir.CnTax = newData.CnTax + AdtCnTax;
                    changeInfo.RefundInfo.OrderAir.YqTax = newData.YqTax + AdtYqTax;
                  }
                changeInfo.RefundInfo.TaxDiff = TaxDiff;
                changeInfo.RefundInfo.PriceDiff = PriceDiff;

                let tips = ''
                let tips1 = I18nUtil.translate('自愿改期将按照航空公司改签规则收费，请确认是否继续提交?')
                let tips2 =response.data.TotalFee? I18nUtil.tranlateInsert2('\n    本次改期费共{{noun1}}元，含票面差价{{noun2}}元及改期手续费/税差{{noun3}}元',response.data.TotalFee,response.data.PriceDiff,response.data.ReissueFee+response.data.TaxDiff) :''
                let tips3 = I18nUtil.translate('\n   *因价格实时变动，最终具体金额以航司确认为准。')
                let tips4 = I18nUtil.translate("\n*改期手续费一旦支付，航司不予退还")
                //专享和51的提示有语判断
                let bookStr = Util.Parse.isChinese() ? '    因选择航班运价不同，优享权益会有变化，请以最终确认为准' : "  The privileged benefits may change due to different flights. Final confirmation is subject to the airline."
                let book51 =(oldModelDetail.OrderAir.ProductCabins!=null && oldModelDetail.OrderAir.ProductCabins.length>0 && oldModelDetail.SupplierType ==1) || newData.SupplierType ==2 ?bookStr:''
                if(this.state.reasonCode === '2'){
                    tips = I18nUtil.translate("航班变动改期需等待航空公司审核，请确认是否继续提交？") + tips4;
                }else{
                    tips = tips1+tips2+tips3+book51+tips4
                }
                this.showAlertView(tips, 
                    () => {
                    return ViewUtil.getAlertButton('取消', () => {
                        this.dismissAlertView();
                    }, '确定', () => {
                        this.dismissAlertView();
                        this._submintChangeNext(changeInfo,true)
                    })
                },null,null,book51)
            } else {
                this.showChangeFeeAlert(response.data.ReissueFee,oldModelDetail,changeInfo,newData);
            }
        }).catch(error => {
            this.hideLoadingView();
            this.showChangeFeeAlert(response.data.ReissueFee,oldModelDetail,changeInfo,newData);
            // this.toastMsg(error.message || '数据异常');
        })
    }

    showChangeFeeAlert = (ReissueFeeData,oldModelDetail,changeInfo,newData)=>{
        changeInfo.RefundInfo.RescheduleCharge = ReissueFeeData
        let tips = ''
        let tips1 = I18nUtil.translate('自愿改期将按照航空公司改签规则收费，请确认是否继续提交?')
        let tips3 = I18nUtil.translate('\n   *因价格实时变动，最终具体金额以航司确认为准。')
        let tips4 = I18nUtil.translate("\n*改期手续费一旦支付，航司不予退还")
        //专享和51的提示有语判断
        let bookStr = Util.Parse.isChinese() ? '    因选择航班运价不同，优享权益会有变化，请以最终确认为准' : "  The privileged benefits may change due to different flights. Final confirmation is subject to the airline."
        let book51 =(oldModelDetail.OrderAir.ProductCabins!=null && oldModelDetail.OrderAir.ProductCabins.length>0 && oldModelDetail.SupplierType ==1) || newData.SupplierType ==2 ?bookStr:''
        if(this.state.reasonCode === '2'){
            tips = I18nUtil.translate("航班变动改期需等待航空公司审核，请确认是否继续提交？") + tips4;
        }else{
            tips = tips1+tips3+book51+tips4
        }
        this.showAlertView(tips, 
            () => {
            return ViewUtil.getAlertButton('取消', () => {
                this.dismissAlertView();
            }, '确定', () => {
                this.dismissAlertView();
                this._submintChangeNext(changeInfo,false)
            })
        },null,null,book51)
    }

    _submintChangeNext(changeInfo,IsgetChangeFee){
            const { oldData } = this.params;
            changeInfo.IsRescheduleChargeSuccess = IsgetChangeFee
            this.showLoadingView();
            FlightService.Reschedule(changeInfo).then(response => {
                this.hideLoadingView();
                if (response && response.success) {
                    this.showAlertView('改签订单提交成功', () => {
                        return ViewUtil.getAlertButton('确定', () => {
                            this.dismissAlertView();
                            DeviceEventEmitter.emit(Key.FlightOrderListChange, { Id: oldData.Id });
                            DeviceEventEmitter.emit('deleteApply', {});
                            NavigationUtils.popToTop(this.props.navigation);
                            DeviceEventEmitter.emit('goHome', {});
                        })
                    })
                } else {
                    this.toastMsg(response.message || '提交订单失败');
                }
            }).catch(error => {
                this.hideLoadingView();
                this.toastMsg(error.message || '提交订单异常');
            })
    }
    
    _resetSelect = () => {
        this.pop();
    }

    renderBody() {
        const { order, reasonDesc, options, ApproverInfo,fileList } = this.state;
        if (!order) return null;
        const traveller = order.Travellers[0] || {};
        let ApprovePersonNames = []
        if (ApproverInfo && ApproverInfo.ApproveList && ApproverInfo.ApproveList.length > 0) {
            ApproverInfo.ApproveList.forEach(obj => {
                ApprovePersonNames.push(obj.ApprovePersonName);
            })
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
                <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    <View style={{  padding: 10 }}>
                        <HeaderView
                            headerTextTile='原'
                            model={order.OrderAir}
                            otwThis={this}
                        />
                        <View style={{height:10}}></View>
                        <HeaderView
                            headerTextTile='改'
                            model={this.params.newData}
                            otwThis={this}
                        />
                    </View>
                    {/* <View style={{ backgroundColor: "white", paddingHorizontal: 10, paddingVertical: 15 }}>
                        <CustomText text={`${I18nUtil.translate('乘机人')}：${traveller.Name}`} />
                    </View> */}
                    <View style={{marginHorizontal:10,borderRadius:6,padding:10,backgroundColor: "white",}}>
                        <View style={{  paddingHorizontal: 10, paddingVertical: 10,flexDirection:'row' }}>
                                <Image source={require('../../res/Uimage/shu.png')} style={{width:14,height:14}}/>
                                <CustomText text={`${I18nUtil.translate('乘机人')}：${traveller.Name}`} />
                        </View>
                        <View style={{ height: 0.5, backgroundColor: Theme.lineColor }}></View>
                        <TouchableHighlight underlayColor='transparent' onPress={this._selectReason}>
                            <View style={{ backgroundColor: "white", alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 15 }}>
                                <HighLight name={reasonDesc ? reasonDesc : '请选择改签原因'} />
                                <Ionicons name={'chevron-forward'} size={22} color={'lightgray'} />
                            </View>
                        </TouchableHighlight>
                    </View>

                    <CustomeTextInput style={styles.input} placeholder='请输入改签原因' returnKeyType={'done'} maxLength={125} onChangeText={text => this.setState({ inputReason: text })} />
                    {this._renderUpFile()}
                    {
                        ApproverInfo?.WorkflowChooseOneOrAll && !order.MassOrderId ?
                        <View style={{backgroundColor:'#fff',marginHorizontal:10,marginBottom:10,padding:10, borderRadius:6}}>
                                <CustomText text='审批信息' style={{ margin: 10 }} />
                                {
                                    Array.isArray(ApproverInfo?.ApproveList) && ApproverInfo.ApproveList.length > 0 ?
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center', backgroundColor: 'white' }}>
                                            <CustomText text='审批级别' />
                                            <CustomText text={`${ApproverInfo.ApproveList.length}级审批`} />
                                        </View> : null
                                }
                                {
                                    Array.isArray(ApprovePersonNames) && ApprovePersonNames.length > 0 ?
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, alignItems: 'center', backgroundColor: 'white' }}>
                                            <CustomText text='审批人' />
                                            <CustomText text={ApprovePersonNames.join(',')} />
                                        </View> : null
                                }
                            </View> 
                        :
                        null
                    }
                    {
                       order.MassOrderId && ApproverInfo?.WorkflowChooseOneOrAll && Array.isArray(ApproverInfo.ApprovalModel?.Steps) && ApproverInfo.ApprovalModel.Steps.length>0 ?
                        <View style={{backgroundColor:'#fff',marginHorizontal:10, padding:10,borderRadius:6}}>
                                <TitleView2 required={false} title={'审批信息'}  style={{marginLeft:10}}></TitleView2>
                                {
                                    ApproverInfo.ApprovalModel?.Steps&&ApproverInfo.ApprovalModel.Steps.map((item,index)=>{
                                        if(this.params.approve){
                                            item.approvalPerson = item.Persons[0]
                                        }
                                        return(
                                            <View style={{ flex: 6,height:40,justifyContent:'center' ,flexDirection:'row',paddingHorizontal:10,borderBottomWidth:1,borderBottomColor:Theme.lineColor}}>
                                                <TouchableOpacity style={{flex: 7,flexDirection:'row'}} disabled={this.params.approve?true:false} 
                                                onPress={this._toSelecApproval.bind(this,item,index)}
                                                >
                                                    <CustomText text={index+1+'级审批人'} style={{ flex: 3, height:40, paddingTop:10}} />
                                                    <CustomText text={item.approvalPerson&&item.approvalPerson.Name} numberOfLines={2} style={{flex: 7, height:40, paddingTop:10,width:10}}/>
                                                </TouchableOpacity>
                                                <Ionicons name={'chevron-forward'} size={22} color={'lightgray'} style={{height:40,paddingTop:9}} />
                                            </View>
                                        )
                                    })
                                }
                        </View>
                        :null
                    }
                    
                    {
                       fileList.map((item,index)=>{
                            return(
                                <View style={{ flexDirection: 'row', height: 44, alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 20,justifyContent:'space-between',marginHorizontal:10,borderRadius:4}}>
                                    <CustomText text={item.FileName}></CustomText>                 
                                    <AntDesign name={'delete'} onPress={()=>{
                                        fileList.splice(index,1);
                                        this.setState({})
                                    }} size={22} color={Theme.theme} />
                                </View>  
                            )
                        })
                    }

                </KeyboardAwareScrollView>
                <CustomActioSheet ref={o => this.actionSheet = o} options={options} onPress={this._handlePress} />
                <RuleView ref={o => this.ruleView = o} />
                <RuleView2 ref={o => this.ruleView2 = o} />
                {
                    ViewUtil.getTwoBottomBtn('重新选择',this._cancelChange,'确定改签',this._submintChange)
                }
            </LinearGradient>
        )
    }

    _renderUpFile = () => {
        const { customerInfo } = this.state;
        return(
            customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.AirRessieContainsAttachment
            ?
            <View style={{margin:10,backgroundColor:'#fff',paddingHorizontal:20,borderRadius:6,paddingVertical:10}}>
                 <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between', backgroundColor:'#fff' , borderColor: Theme.lineColor, borderBottomWidth:1,flexWrap:'wrap'}}>
                        {
                            customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.AirRessieNecessary?
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

    _toSelecApproval=(item,index)=>{
        let personList = [];
        item.Persons.map((obj)=>{
            personList.push(obj.Id)
        })
        NavigationUtils.push(this.props.navigation, 'ChooseSinglePersonList', {
            title: '选择审批人',
            personList: personList,
            approvalCallBack: (data) => {
                item.approvalPerson = {
                    level:index+1,
                    Id:data.id,
                    Name:data.text,
                    extendtext:data.extendtext
                }
                this.setState({});
            }
        })
    }
}
const getStateProps = state => ({
    feeType: state.feeType.feeType,
    comp_userInfo:state.comp_userInfo
})
export default connect(getStateProps)(FlightChangeScreen);
const styles = StyleSheet.create({
    input: {
        margin: 10,
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
    }
})
