
import api from '../res/styles/Api';
import FetchHelper from '../common/FetchHelper';
import StorageUtil from '../util/StorageUtil';
import Key from '../res/styles/Key';
import CryptoJS from "react-native-crypto-js";//加密、解密
import ViewUtil from '../util/ViewUtil';
import React from 'react';
import {View,TouchableHighlight,ScrollView,Platform,} from 'react-native';
// import Pop from 'rn-global-modal';
import CustomText from '../custom/CustomText';
import Theme from '../res/styles/Theme';
import HTMLView from 'react-native-htmlview';

export default class CommonService {

    /**
    * 登录
    */
    static login(loginModel) {
        loginModel = loginModel || {};
        Object.assign(loginModel, {
            Platform: Platform.OS,
            EquipId: Platform.OS,
        })
        return FetchHelper.post(baseUrl + api.login, loginModel);
    }
    /** 
     *  获取用户信息
     */
    static getUserInfo() {
        return FetchHelper.post(baseUrl + api.currentUserInfo);
    }

    /**
      * 客户信息
      */
    static customerInfo(model) {
        // return FetchHelper.post(baseUrl + api.currentCustomerInfo, model);
        return new Promise((resolve, reject) => {
            FetchHelper.post(baseUrl + api.currentCustomerInfo, model).then(response => {
                if (response && response.success && response.data) {
                    let cipherCustomer = CryptoJS.AES.encrypt(JSON.stringify(response.data), Key.CustomerInfo).toString();
                    StorageUtil.saveKey(Key.CustomerInfo, cipherCustomer);
                }
                resolve(response);
            }).catch(error => {
                reject(error);
            })
        })
    }
    /**
    * 客户设置
    */
    static customerSetting() {
        return FetchHelper.post(baseUrl + api.currentCustomerSetting);
    }

    /**
     *  退出登录
     */
    static logout = () => {
        return FetchHelper.post(baseUrl + api.currentUserLogout);
    }
    /**
    * 发送验证码
    */
    static sendValidateCode(sendModel) {
        return FetchHelper.post(baseUrl + api.smsValidateCodeSend, sendModel);
    }
    /**
     * 检查验证码
     */
    static checkValidaCode(checkModel) {
        return FetchHelper.post(baseUrl + api.smsValidateCodeCheck, checkModel);
    }
    /**
    * 发送Email验证码
    */
     static forgetPasswordSendEmail(sendModel) {
        return FetchHelper.post(baseUrl + api.ForgetPasswordSendEmail, sendModel);
    }
    /**
     * 检查Email判断邮箱是否重复
     */
    static QuerySerialNumberByEmail(checkModel) {
        return FetchHelper.post(baseUrl + api.QuerySerialNumberByEmail, checkModel);
    }
    /**
    * 重置密码
    */
    static resetPassword(resetModel) {
        return FetchHelper.post(baseUrl + api.smsValidateResetPassword, resetModel);
    }
    /**
    * Email重置密码
    */
    static EmailResetPassword(resetModel) {
        return FetchHelper.post(baseUrl + api.ForgetPasswordRestPassword, resetModel);
    }
    /**
   * 检查验证码
   */
    static checkValidaCode(checkModel) {
        return FetchHelper.post(baseUrl + api.smsValidateCodeCheck, checkModel);
    }
    /**
   * 企业注册
   */
    static enterpriseRegister(registerModel) {
        return FetchHelper.post(baseUrl + api.enterpriseRegister, registerModel);
    }
    /**
     * 版本升级提醒
     */
    static versionUpgrade = () => {
        return FetchHelper.post(baseUrl + api.appLastVersion);
    }
    /**
    * 获取待审批单据数量接口
    */
    static WaitAooroveCount = () => {
        return FetchHelper.post(baseUrl + api.waitMyApproveCount);
    }
    /**
    * 修改密码
    */
    static modifyPassword(modifyModel) {
        return FetchHelper.post(baseUrl + api.currentUserChangePassword, modifyModel);
    }
    /**
    * 获取差旅标准的接口
    */
    static GetTravelStandards = (model) => {
        
        return FetchHelper.post(baseUrl + api.travelStandards, model);
    }

    /**
     * 常旅客列表
     */
    static travellerList(queryModel) {
        return FetchHelper.post(baseUrl + api.currentUserTravellerList, queryModel);
    }

    /**
     * 员工列表
     */
    static employeeList(queryModel) {
        return FetchHelper.post(baseUrl + api.currentUserEmployeeList, queryModel);
    }

    /**
     * 项目列表
     */
    static projectList(queryModel) {
        return FetchHelper.post(baseUrl + api.currentUserProjectList, queryModel);
    }
    /**
     * 字典项列表
     */
    static dictList(queryModel) {
        return FetchHelper.post(baseUrl + api.customerDictItemList, queryModel);
    }
    // 授权人
    static CustomerApproverList = (model) => {
        return FetchHelper.post(baseUrl + api.customerApproverList, model);
    }
    /**
    * 获取审批人的信息
    */
    static ApproveInfo = (params) => {
        return FetchHelper.post(baseUrl + api.approveInfo, params);
    }
    /**
    * 获取可选审批人
    */
    static getApproverBySetp = (params) => {
        return FetchHelper.post(baseUrl + api.getApproverBySetp, params);
    }
    /**
   * 取消支付订单
   */
    static PaymentCancel = (model) => {
        return FetchHelper.post(baseUrl + api.paymentCancel, model);
    }
    /**
   * 创建支付单请求参数
   */
    static paymenPayload = (model) => {
        return FetchHelper.post(baseUrl + api.paymentApp, model);
    }
    /**
 * 获取支付信息
 */
    static PaymentInfo = (model) => {
        return FetchHelper.post(baseUrl + api.paymentInfo, model);
    }

    /**
    * 获取国籍
    */
    static getCountryList(model) {
        return FetchHelper.post(baseUrl + api.countrylist, model);
    }
    //上传证件照
    static CertificateImageUpload = (model) => {
        return FetchHelper.upload(baseUrl + api.CertificateImageUpload, model);
    }
    /**
   * 获取数据字典项
   */
    static CurrentDictList = (model) => {
        return FetchHelper.post(baseUrl + api.CurrentDictList,model);
    }
    /**
   * 获取申请单城市的信息
   */
    static CommonArea = (model) => {
        return FetchHelper.post(baseUrl + api.CommonArea, model);
    }

    /**
     *  全部数据
     */
    static CommonCity = (model) => {
        return FetchHelper.post(baseUrl + api.CommonCity,model);
    }

    /**
    * 公告列表
    */
    static noticeList() {
        return new Promise((resolve, reject) => {
            FetchHelper.post(baseUrl + api.CustomerNoticeList).then(response => {
                if (response && response.success) {
                    if (response.data && response.data.ListData && response.data.ListData instanceof Array) {
                        resolve(response.data);
                    } else {
                        reject({
                            message: '解析列表异常'
                        });
                    }
                } else {
                    reject(response);
                }
            }).catch(error => {
                reject(error);
            });
        });
    }
    // 删除常旅客
    static CurrentUserTravellerRemove = (model) => {
        return FetchHelper.post(baseUrl + api.CurrentUserTravellerRemove, model);
    }
    //编辑常旅客信息
    static CurrentUserTravellerEdit = (model) => {
        return FetchHelper.post(baseUrl + api.CurrentUserTravellerEdit, model);
    }
    /**
     * 增加新的常旅客的操作
     */
    static CurrentUserTravellerAdd = (model) => {
        return FetchHelper.post(baseUrl + api.CurrentUserTravellerAdd, model);
    }
    /**
   * 编辑客户的个人信息的操作
   */
    static CurrentUserEmployeeEdit = (model) => {
        return FetchHelper.post(baseUrl + api.CurrentUserEmployeeEdit, model);
    }
    static CurrentUserEditAuthorizedApprove = (model) => {
        return FetchHelper.post(baseUrl + api.CurrentUserEditAuthorizedApprove, model);
    }
    //问题反馈功能
    static GetWorkOrder = (model) => {
        return FetchHelper.upload(baseUrl + api.CreateWorkOrder, model);
    }
    // 获取差旅报告的所属部门或者项目
    static CustomerEmployeeLenderInfo = () => {
        return FetchHelper.post(baseUrl + api.CustomerEmployeeLeaderInfo);
    }
    // 差旅报告信息
    static TravelReportSummyInfo = (model) => {
        return FetchHelper.post(baseUrl + api.TravelReportSummyInfo, model);
    }
    // 差旅报告分析
    static TravelReportAnalysis = (model) => {
        return FetchHelper.post(baseUrl + api.TravelReportAnalysis, model);
    }
    // 获取差旅报告列表
    static TravelReportAnalysisOrders = (model) => {
        return FetchHelper.post(baseUrl + api.TravelReportAnalysisOrders, model);
    }
    /**
      * 获取广告的操作
      */
    static CustomerNoticeADList = () => {
        let model = {
            Query: {
                Category: 128
            },
            Pagination: {
                PageSize: 4,
                PageIndex: 1
            }
        }
        return FetchHelper.post(baseUrl + api.CustomerNoticeADList, model);
    }
    /**
     * 获取动态登录验证码
     * 
     */
    static SmsSendForApp = (model) => {
        return FetchHelper.post(baseUrl + api.SmsSendForApp, model);
    }
    /**
     *  验证 验证码
     */
    static SmsValidateForApp = (model) => {
        return FetchHelper.post(baseUrl + api.SmsValidateForApp, model);
    }
    /**
     *  动态登录
     */
    static CreateUserTokenForMobile = (model) => {
        return FetchHelper.post(baseUrl + api.CreateUserTokenForMobile, model)
    }
    // 绑定手机号的验证
    static CurrentUserBindMobileCaptcha = (model) => {
        return FetchHelper.post(baseUrl + api.CurrentUserBindMobileCaptcha, model);
    }
    // 绑定手机号
    static CurrentUserBindMobile = (model) => {
        return FetchHelper.post(baseUrl + api.CurrentUserBindMobile, model);
    }
    //广告位
    static GetAdStrategyContent = (ADCode) => {
        let model = {
            ADCode
        }
        return FetchHelper.post(baseUrl + api.GetAdStrategyContent, model);
    }
    /**
     * 钱包支付
     */
    static PaymentWallet = (model) => {
        return FetchHelper.post(baseUrl + api.PaymentWallet, model);
    }
    /**
     *消息数量汇总
     */
     static CurrentUserMessageSummary = (model)=>{
         return FetchHelper.post(baseUrl + api.CurrentUserMessageSummary,model);
     }
     //消息数量列表
     static CurrentUserMessageList = (model)=>{
         return FetchHelper.post(baseUrl + api.CurrentUserMessageList,model);
     }
     // 标记已读
     static CurrentUserMessageRead = (model)=>{
         return FetchHelper.post(baseUrl + api.CurrentUserMessageRead,model);
     }
     //批量标记
     static CurrentUserMessageBatchRead = (model)=>{
         return FetchHelper.post(baseUrl + api.CurrentUserMessageBatchRead,model);
     }
     //获取登录用户综合信息
     static CurrentUserMassInfo = ()=>{
        return FetchHelper.post(baseUrl + api.CurrentUserMassInfo);
    }
    //获取服务费信息
    static CurrentCustomerServiceFees = (model)=>{
        return FetchHelper.post(baseUrl + api.CurrentCustomerServiceFees,model);
    }
    //设置当前用户语言偏好
    static CurrentUserChangeLanguage = (model)=>{
        return FetchHelper.post(baseUrl + api.CurrentUserChangeLanguage,model);
    }
    //获取中英文翻译文件
    static LanguageSource = ()=>{
        return FetchHelper.post(baseUrl + api.LanguageSource);
    }

   // 高危城市提示
   static HighRiskPC = (model,otwThis)=>{
        return new Promise((resovle,reject)=>{
            // otwThis.showLoadingView();
            FetchHelper.post(baseUrl + api.HighRiskPC,model).then(res=>{
                // otwThis.hideLoadingView();
                if(res && res.success){
                    if(res.data){
                        let highRisk = res.data.find(obj=>obj.Type == 2);
                        if(highRisk){
                            if(highRisk.Level == 3 || highRisk.Level == 2){
                                Pop.show(
                                    <View style={{ width: '80%', backgroundColor:'#fff',borderRadius:8,padding:10}}>
                                    <View style={{alignItems:'center',justifyContent:'center'}}>
                                        <CustomText text={'温馨提示'} style={{margin:6,fontSize:18, fontWeight:'bold'}} />
                                    </View>
                                    {/* <ScrollView style={{}}>
                                        <CustomText text={highRisk.Message} style={{padding:2,fontSize:14}}/>
                                    </ScrollView> */}
                                        <ScrollView style={{width:'100%'}}>
                                                <HTMLView value={highRisk.Message} style={{ padding:12}} /> 
                                        </ScrollView>
                                    <TouchableHighlight underlayColor='transparent' 
                                                style={{height:40,alignItems:'center',justifyContent:'center',marginTop:10,borderTopWidth:1,borderColor:Theme.lineColor}}
                                                onPress={()=>{
                                                    Pop.hide()
                                                        if(highRisk.Level == 2){
                                                        resovle(highRisk);
                                                        }
                                                    }}>
                                                <CustomText  text='确定' style={{fontSize:19,color:Theme.theme}}/>
                                        </TouchableHighlight>
                                    </View>
                                    ,{animationType: 'fade', maskClosable: false, onMaskClose: ()=>{}})
                            }else{
                                if(highRisk.Level == 0){
                                    resovle();
                                }else{
                                    resovle(highRisk);
                                }
                            
                            }
                        }else{
                            resovle();
                        }
                    //    console.log(highRisk);
                    }else{
                        resovle(); 
                    }
                }else{
                    otwThis && otwThis.toastMsg(res.message || '获取数据失败，请重试');
                }
            }).catch(error=>{
                // otwThis.hideLoadingView();
            otwThis && otwThis.toastMsg(error.message || '获取数据失败，请重试');
            reject(error);
            });
        })
    }
    static HighRiskPC2 = (model,otwThis)=>{
        return FetchHelper.post(baseUrl + api.HighRiskPC,model);
    }
    //维护信提示是否显示
    static CurrentUserTipsPersonalInformation = (model)=>{
        return FetchHelper.post(baseUrl + api.CurrentUserTipsPersonalInformation,model);
    }

    static OrderValidateTravelApply(model) {
        return FetchHelper.post(baseUrl + api.OrderValidateTravelApply, model);
    }

    /**
     *检查银联号码
    */
    static validateAndCacheCardInfo = (model) => {
        return FetchHelper.post(`https://ccdcapi.alipay.com/validateAndCacheCardInfo.json?cardNo=${model.cardNo}&cardBinCheck=${true}`);
    }

    /**
     * 航空公司列表
     */
    static GetAirLineList(model) {
        return FetchHelper.post(baseUrl + api.GetAirLineList, model);
    }

     /**
     * 酒店列表
     */
    static HotelGroupList(model) {
        return FetchHelper.post(baseUrl + api.HotelGroupList, model);
    }

    /**
     * 登录前获取，判断是否需要腾讯验证
     */
    static LoginConfig(){
        return FetchHelper.post(baseUrl + api.LoginConfig);
    }

    static TravelApplyFileUpload(model){
        return FetchHelper.upload(baseUrl + api.application.TravelApplyFileUpload, model);
    }

    static OrderFileUpload(model){
        return FetchHelper.upload(baseUrl + api.OrderFileUpload, model);
    }

    static OrderHubInvoiceRight(){
        return FetchHelper.get(baseUrl + api.OrderHubInvoiceRight);
    }

    static OrderHubInvoiceList(model) {
        return FetchHelper.post(baseUrl + api.OrderHubInvoiceList, model);
    }

    static OrderHubDownloadInvoice(model){
        return FetchHelper.post(baseUrl + api.OrderHubDownloadInvoice, model);
    }

    static TravelApplyUrgeApproval(model){
        return FetchHelper.post(baseUrl + api.TravelApplyUrgeApproval, model);
    }

    static TravelApplyCheckTravelApplyMode(model){
        return FetchHelper.post(baseUrl + api.TravelApplyCheckTravelApplyMode, model);
    }

    static GetCreditCardList(){
        return FetchHelper.post(baseUrl + api.GetCreditCardList);
    }

    static CreateCreditCard(model){
        return FetchHelper.post(baseUrl + api.CreateCreditCard, model);
    }

    static DeleteCreditCard(model){
        return FetchHelper.post(baseUrl + api.DeleteCreditCard, model);
    }

    static GetCreditCardRaw(model){
        return FetchHelper.post(baseUrl + api.GetCreditCardRaw, model);
    }

    static GetMelaData(model){
        return FetchHelper.post(baseUrl + api.CommonEnum, model);
    }
    static CurrentUserBiometriciBind(model){
        return FetchHelper.post(baseUrl + api.CurrentUserBiometriciBind, model);
    }
    static CheckUserBiometricIdentification(model){
        return FetchHelper.post(baseUrl + api.CheckUserBiometricIdentification, model);
    }
    static CurrentUserUnbindBiometric(model){
        return FetchHelper.post(baseUrl + api.CurrentUserUnbindBiometric, model);
    }
    static TravelerManagerList(model){
        return FetchHelper.post(baseUrl + api.TravelerManagerList, model);
    }
    static HandShakeDeleteCreditCard(model){
        return FetchHelper.post(baseUrl + api.HandShakeDeleteCreditCard, model);
    }
    static HandShakeCreateCreditCard(model){
        return FetchHelper.post(baseUrl + api.HandShakeCreateCreditCard, model);
    }
    static HandShakeGetCreditCardList(model){
        return FetchHelper.post(baseUrl + api.HandShakeGetCreditCardList, model);
    }
    static HandShakeGetCreditCardRaw(model){
        return FetchHelper.post(baseUrl + api.HandShakeGetCreditCardRaw, model);
    }

    //编辑信用卡
    static UpdateCreditCard(model){
        return FetchHelper.post(baseUrl + api.UpdateCreditCard, model);
    }

    //编辑出行人信用卡
    static HandShakeUpdateCreditCard(model){
        return FetchHelper.post(baseUrl + api.HandShakeUpdateCreditCard, model);
    }

    //握手选人
    static HandShakeEmployeeQuery (model){
        return FetchHelper.post(baseUrl + api.HandShakeEmployeeQuery, model);
    }
    static HandShakeApprove (model){
        return FetchHelper.post(baseUrl + api.HandShakeApprove, model);
    }
    static AnalyzePdfDictionary (model){
        return FetchHelper.post(baseUrl + api.AnalyzePdfDictionary, model);
    }
    static EmployeeQueryForApproveAgent (model){
        return FetchHelper.post(baseUrl + api.EmployeeQueryForApproveAgent, model);
    }
    static PaymentAllList (model){
        return FetchHelper.post(baseUrl + api.PaymentAllList, model);
    }
    static PaymentAllList (model){
        return FetchHelper.post(baseUrl + api.PaymentAllList, model);
    }
    static PaymentSerialNumberList (model){
        return FetchHelper.post(baseUrl + api.PaymentSerialNumberList, model);
    }
    static FlightOrderApiPay (model){
        return FetchHelper.post(baseUrl + api.FlightOrderApiPay, model);
    }
    static TrainOrderApiPay (model){
        return FetchHelper.post(baseUrl + api.TrainOrderApiPay, model);
    }
    static CurrentUserMessageChangeStatus (model){
        return FetchHelper.post(baseUrl + api.CurrentUserMessageChangeStatus, model);
    }
    static AppPushRegister (model){
        return FetchHelper.post(baseUrl + api.AppPushRegister, model);
    }
     //飞机机型列表
    static GetCraftTypeList(){
        return FetchHelper.post(baseUrl + api.GetCraftTypeList);
    }

    static ProfileCommonEnum(model){
        return FetchHelper.post(baseUrl + api.ProfileCommonEnum, model);
    }
     //出行人更新检查
    static MassOrderTravellerUpdateCheck(model){
        return FetchHelper.post(baseUrl + api.MassOrderTravellerUpdateCheck, model);
    }
}