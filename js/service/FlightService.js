
import FetchHelper from '../common/FetchHelper';
import api from '../res/styles/Api';

export default class FlightService {


    /*
     * 获取国内机票的城市列表
     */
    static GetCityList = () => {
        return FetchHelper.get(baseUrl + api.flight.city_code);
    }
    static GetCityList2 = () => {
        return FetchHelper.post(baseUrl + api.flight.FlightCityList);
    }
    /**
   * 订单列表
   */
    static orderList(queryModel) {
        return new Promise((resolve, reject) => {
            FetchHelper.post(baseUrl + api.flight.orderList, queryModel).then(response => {
                if (response && response.success) {
                    if (response.data && response.data.ListData && response.data.ListData instanceof Array) {
                        resolve(response.data);
                    } else {
                        reject({
                            message: '解析订单列表异常'
                        });
                    }
                } else {
                    reject(response);
                }
            }).catch(error => {
                reject(error || {
                    message: '获取订单列表异常'
                });
            });
        });
    }
    /*
     获取机票最低价格的操作
     */
    static GetFlightLowPrice = (params) => {
        return FetchHelper.post(baseUrl + api.flight.fltQueryLowPrice, params);
    }
    /** 
     * 获取改签最低价
     */
    static GetReissueQuery = (params) => {
        return FetchHelper.post(baseUrl + api.flight.fltReissueQuery, params);
    }
    /**
    * 获取经停数据
    */
    static GetFlightStopInfo = (params) => {
        return FetchHelper.post(baseUrl + api.flight.flightStopInfo, params);
    }
    /*
    获取机票的更多价格
   */
    static GetFlightMorePrice = (params) => {
        return FetchHelper.post(baseUrl + api.flight.fltQueryMorePrice, params);
    }
    /**
     * 春秋航空查询客规
     */
    static GetChTravellerRules = (params) => {
        return FetchHelper.post(baseUrl + api.flight.chTravellerRules, params);
    }
    /**
     * 春秋航囧绑定产品
     */
    static GetChQueryBindProduct = (params) => {
        return FetchHelper.post(baseUrl + api.flight.chQueryBindProduct, params);
    }
    /*
     检验差旅规则的操作
    */
    static MatchTravelRules = (params) => {
        return FetchHelper.post(baseUrl + api.flight.newMatchTravelRules, params);
    }
    /**
     * 提交订单
     */
    static FlightorderCreate = (params) => {
        return FetchHelper.post(baseUrl + api.flight.fltOrderCreate, params);
    }
    /**
     * 提交订单催审
     */
    static orderRemind(remindModel) {
        return FetchHelper.post(baseUrl + api.flight.flightOrderApproveNotify, remindModel);
    }
    /**
     * 提交订单取消
     */
    static orderCancel(cancelModel) {
        return FetchHelper.post(baseUrl + api.flight.fltOrderCancel, cancelModel);
    }
    /**
     * 订单详情
     */
    static orderDetail(orderId) {
        const detailModel = {
            orderId: orderId
        };
        return FetchHelper.post(baseUrl + api.flight.filghtOrderInfo, detailModel);
    }
    /**
     * 企业飞机订单详情
     */
    static Enterprise_orderDetail(orderId) {
        const detailModel = {
            OrderId: orderId
        };
        return FetchHelper.post(baseUrl + api.enterpriseOrderDetail.flightOrderDetail, detailModel);
    }
    /**
     * 计算退票费用
     */
    static OrderRefundPrice = (model) => {
        return FetchHelper.post(baseUrl + api.flight.flightOrderRefundPrice, model);
    }
    /**
    * 提交订单退票
    */
    static orderRefund(refundModel) {
        return FetchHelper.post(baseUrl + api.flight.flightOrderRefund, refundModel);
    }
    /**
     * 提交改签
     */
    static Reschedule = (model) => {
        return FetchHelper.post(baseUrl + api.flight.flightOrderReschedule, model);
    }
    /**
    * 代付款订单查询接口
    */
    static PaymnetBatchList(queryModel) {
        return new Promise((resolve, reject) => {
            FetchHelper.post(baseUrl + api.flight.paymentList, queryModel).then(response => {
                if (response && response.success) {
                    if (response.data && response.data.ListData && response.data.ListData instanceof Array) {
                        resolve(response.data);
                    } else {
                        reject({
                            message: '解析订单列表异常'
                        });
                    }
                } else {
                    reject(response);
                }
            }).catch(error => {
                reject(error || {
                    message: '获取订单列表异常'
                });
            });
        });
    }
  
  

    /**
    * 审批列表
    */
    static approvalList(model) {
        return new Promise((resolve, reject) => {
            FetchHelper.post(baseUrl + api.flight.flightOrderMyApproveList, model).then(response => {
                if (response && response.success) {
                    if (response.data && response.data.DataSource) {
                        resolve(response.data.DataSource);
                    } else {
                        reject({
                            message: '解析审批列表异常'
                        });
                    }
                } else {
                    reject(response);
                }
            }).catch(error => {
                reject(error || {
                    message: '获取数据异常'
                });
            });
        });
    }
    /**
   * 批准
   */
    static approve(approveModel) {
        return FetchHelper.post(baseUrl + api.flight.flightOrderApprove, approveModel);
    }
    /**
   * 驳回
   */
    static reject(rejectModel) {
        return FetchHelper.post(baseUrl + '/api/FlightOrderApprove', rejectModel);
    }
     /**
   * 驳回
   */
     static ChTravellerRules(Model) {
        return FetchHelper.post(baseUrl + '/api/ChTravellerRules', Model);
    }
    //查询出行人
    static MyTravelerList(Model) {
        return FetchHelper.post(baseUrl + api.flight.MyTravelerList, Model);
    }
    //添加出行人
    static AddMyNewTraveler(Model) {
        return FetchHelper.post(baseUrl + api.flight.AddMyNewTraveler, Model);
    }
    //删除出行人
    static RemoveMyTraveler(Model) {
        return FetchHelper.post(baseUrl + api.flight.RemoveMyTraveler, Model);
    }
    //查询出行人
    static MyBookerList(Model) {
        return FetchHelper.post(baseUrl + api.flight.MyBookerList, Model);
    }
    //查询握手授权人
    static addMyBooker(Model) {
        return FetchHelper.post(baseUrl + api.flight.addMyBooker, Model);
    }
    //删除握手授权人
    static RemoveMyBooker(Model) {
        return FetchHelper.post(baseUrl + api.flight.RemoveMyBooker, Model);
    }
    //撤回握手授权人
    static RequestForWithdraw(Model) {
        return FetchHelper.post(baseUrl + api.flight.RequestForWithdraw, Model);
    }
    //ResubmitHandShakeApprove
    //重新提交授权人
    static ResubmitHandShakeApprove(Model) {
        return FetchHelper.post(baseUrl + api.flight.ResubmitHandShakeApprove, Model);
    }
    // GetElectronicItineraryHeader
    static GetElectronicItineraryHeader(Model) {
        return FetchHelper.post(baseUrl + api.flight.GetElectronicItineraryHeader, Model);
    }
    //退票费
    static FlightOrderRefundPrice(Model){
        return FetchHelper.post(baseUrl + api.flight.FlightOrderRefundPrice, Model)
    }
    //获取改签费
    static FlightOrderReissueFee(Model){
        return FetchHelper.post(baseUrl + api.flight.FlightOrderReissueFee, Model)
    }
    static FlightTicketUnUsedList (Model){
        return FetchHelper.post(baseUrl + api.flight.FlightTicketUnUsedList, Model)
    }
    //国内机票校验是否值机
    static FltOrderValidateTicketStatus(Model){
        return FetchHelper.post(baseUrl + api.flight.FltOrderValidateTicketStatus, Model)
    }
    static OrderPnrSeatInfo(Model){
        return FetchHelper.post(baseUrl + api.flight.OrderPnrSeatInfo, Model)
    }
    //查询座位
    static OrderSeatMap(Model){
        return FetchHelper.post(baseUrl + api.flight.OrderSeatMap, Model)
    }
    //选择座位
    static OrderSeatChoose(Model){
        return FetchHelper.post(baseUrl + api.flight.OrderSeatChoose, Model)
    }
    //删除座位
    static OrderSeatDelete(Model){
        return FetchHelper.post(baseUrl + api.flight.OrderSeatDelete, Model)
    }
}