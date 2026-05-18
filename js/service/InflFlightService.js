import FetchHelper from '../common/FetchHelper';
import api from '../res/styles/Api';
export default class InflFlightService {
    /**
       * 根据关键字获取机场数据
       */
    static getAirportsByKeyword(keyword, limit) {
        return FetchHelper.post(baseUrl + api.inflFlight.CommonAirport2, { Keyword: keyword, Limit: limit });
    }
    /**
    * 订单列表
    */
    static orderList(queryModel) {
        return new Promise((resolve, reject) => {
            FetchHelper.post(baseUrl + api.inflFlight.orderList, queryModel).then(response => {
                if (response.success) {
                    if (response.data && response.data.ListData && Array.isArray(response.data.ListData)) {
                        resolve(response.data);
                    } else {
                        reject({
                            message: '解析订单列表异常'
                        });
                    }
                } else {
                    reject(response);
                }
            }).catch(err => {
                reject(err || { message: '获取订单列表异常' });
            });
        });
    }
    // static getIntlFlightQuery(model) {
    //     return new Promise((resolve, reject) => {
    //         FetchHelper.post(baseUrl + api.inflFlight.IntlFlightQuery, model).then(reponse => {
    //             if (reponse && reponse.data && reponse.success == 1) {
    //                 let transFormData = reponse.data.map((item, index) => {
    //                     for (const value of item.PriceList) {
    //                         if (value.PassengerTypeDesc === '成人') {
    //                             item.Tax = value.Tax;
    //                             item.BasePrice = value.BasePrice;
    //                             item.TotalPrice = value.TotalPrice;
    //                             item.SettlementPrice = value.SettlementPrice;
    //                             break;
    //                         }
    //                     }
    //                     item.Id = '';
    //                     let OWFlights = item.Journeys[0];
    //                     OWFlights.FlightSegments.forEach(flight => {
    //                         item.Id += flight.DepartureAirport + '_' + flight.ArrivalAirport + '_' + flight.Airline + '_' + flight.FlightNumber + '_' + flight.DepartureTime;
    //                     })
    //                     if (item.Journeys && item.Journeys.length === 1) {
    //                         item.OWFlights = item.Journeys[0];

    //                     } else if (item.Journeys && item.Journeys.length === 2) {
    //                         item.OWFlights = item.Journeys[0];
    //                         item.RTFlights = item.Journeys[1];
    //                     }
    //                     return item;
    //                 })

    //                 resolve(transFormData);
    //             } else {
    //                 resolve(reponse || { message: '获取航班列表失败' });
    //             }
    //         }).catch(error => {
    //             reject(error || { message: '获取航班列表异常' })
    //         })

    //     })


    //     // return FetchHelper.post(baseUrl + '/api/IntlFlightQuery', model);
    // }

    static getIntlFlightQuery(model) {
        return FetchHelper.post(baseUrl + api.inflFlight.IntlFlightQuery, model)
            .then(response => {
                if (response && response.data && response.success == 1) {
                    const transFormData = response.data.map(item => {
                        // 取成人乘客价格信息
                        const adultPrice = item.PriceList.find(value => value.PassengerTypeDesc === '成人');
                        if (adultPrice) {
                            item.Tax = adultPrice.Tax;
                            item.BasePrice = adultPrice.BasePrice;
                            item.TotalPrice = adultPrice.TotalPrice;
                            item.SettlementPrice = adultPrice.SettlementPrice;
                        }
    
                        // 拼接唯一Id
                        item.Id = '';
                        const OWFlights = item.Journeys[0];
                        OWFlights.FlightSegments.forEach(flight => {
                            item.Id += `${flight.DepartureAirport}_${flight.ArrivalAirport}_${flight.Airline}_${flight.FlightNumber}_${flight.DepartureTime}`;
                        });
    
                        // 区分单程和往返航班
                        if (item.Journeys.length === 1) {
                            item.OWFlights = item.Journeys[0];
                        } else if (item.Journeys.length === 2) {
                            item.OWFlights = item.Journeys[0];
                            item.RTFlights = item.Journeys[1];
                        }
                        return item;
                    });
                    return transFormData;
                } else {
                    return response || { message: '获取航班列表失败' };
                }
            })
            .catch(error => {
                return Promise.reject(error || { message: '获取航班列表异常' });
            });
    }
    /**
   * 获取退改规则
   */
    static getPolicy(queryModel) {
        return FetchHelper.post(baseUrl + api.inflFlight.IntlFlightGetPolicy, queryModel);
    }
    static getIntlFlightRules(model) {
        return FetchHelper.post(baseUrl + api.inflFlight.IntlFlightRules, model);
    }
    /**
    * 获取中转时间
    */
    static getTransferTime(date, nextDate) {
        if (!date || !nextDate) {
            return null;
        }
        var trasferTimeSpan = nextDate - date;
        if (trasferTimeSpan < 0) {
            trasferTimeSpan = trasferTimeSpan * -1;
        }
        var hours = parseInt(trasferTimeSpan / (60 * 60 * 1000));
        var minutes = parseInt((trasferTimeSpan - hours * 60 * 60 * 1000) / (60 * 1000));
        if (hours > 0 || minutes > 0) {
            return hours + 'h' + minutes + 'm';
        }
        return null;
    }
    static getMoreComboPrice2(model) {
        return FetchHelper.post(baseUrl + api.inflFlight.IntlFlightPrice, model);
    }
    /**
   * 创建订单
   */
    static createOrder(model) {
        return FetchHelper.post(baseUrl + api.inflFlight.IntlOrderCreate, { data: JSON.stringify(model) });
    }
    /** 
    * 催审
    */
    static orderRemind(model) {
        return FetchHelper.post(baseUrl + api.inflFlight.IntlFlightOrderApproveNotify, model);
    }
    /**
     * 
     * 取消
     */
    static orderCancel(model) {
        return FetchHelper.post(baseUrl + api.inflFlight.IntlFlightOrderCancel, model);
    }

    /**
     * 订票单详情
     */
    static orderDetail(orderId) {
        return FetchHelper.post(baseUrl + api.inflFlight.IntlFlightOrderDetail, { OrderId: orderId });
    }
     /**
     * 订票单详情
     */
    static Enterprise_orderDetail(orderId) {
        return FetchHelper.post(baseUrl + api.enterpriseOrderDetail.intlFlightOrderDetail, { OrderId: orderId });
    }
    
    /**
    * 提交退票
    */
    static orderRefund(refundModel) {
        return FetchHelper.post(baseUrl + api.inflFlight.IntlFlightOrderRefund, { data: JSON.stringify(refundModel) });
    }
    /**
   * 提交改签
   */
    static orderReissue(reissueModel) {
        return FetchHelper.post(baseUrl + api.inflFlight.IntlFlightOrderReschedule, { data: JSON.stringify(reissueModel) });
    }
    /**
    * 审批列表
    */
    static approvalList(queryModel) {
        return new Promise((resolve, reject) => {
            FetchHelper.post(baseUrl + api.inflFlight.IntlFlightApproveList, { Data: JSON.stringify(queryModel) }).then(response => {
                if (response && response.success) {
                    if (response.data && response.data.DataSource && Array.isArray(response.data.DataSource.ListData)) {
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
        return FetchHelper.post(baseUrl + api.inflFlight.IntlFlightOrderApprove, { Data: JSON.stringify(approveModel) });
    }
    static GetCommonAirport2() { 
        const detailModel = ['']
        return FetchHelper.post(baseUrl + api.inflFlight.GetCommonAirport2, detailModel );
    }
    static testSso(model) { 
        return FetchHelper.post(baseUrl + api.inflFlight.SsoTest, model);
    }
    /**
     * 国际机票差规检测
     */
    static MatchTravelRules(model) { 
        return FetchHelper.post(baseUrl + api.inflFlight.IntlFlightMatchTravelRules, model);
    }
    /**
     * 
     */
    static CommonAirline(model) { 
        return FetchHelper.post(baseUrl + api.inflFlight.CommonAirline, model);
    }
    /**
     * 国际机票更多查询
     */
    static getIntlFlightQueryByPriceI (model) { 
        return FetchHelper.post(baseUrl + api.inflFlight.getIntlFlightQueryByPriceI, model);
    }
    static FlightOrderPnrSeatInfo (model) { 
        return FetchHelper.post(baseUrl + api.inflFlight.FlightOrderPnrSeatInfo, model);
    }
    static FlightOrderSeatMap (model) { 
        return FetchHelper.post(baseUrl + api.inflFlight.FlightOrderSeatMap, model);
    }
    static FlightOrderSeatChoose (model) { 
        return FetchHelper.post(baseUrl + api.inflFlight.FlightOrderSeatChoose, model);
    }
    static FlightOrderSeatDelete (model) { 
        return FetchHelper.post(baseUrl + api.inflFlight.FlightOrderSeatDelete, model);
    }
}