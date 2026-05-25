import SearchScreen from './SearchScreen';
import IntlFlightCityScreen from './IntlFlightCityScreen';
import IntlFilterScreen from './IntlFilterScreen';
import IntlFlightMorePriceScreen from './IntlFlightMorePriceScreen';
import InflCreateOrderScreen from './InflCreateOrderScreen';
import IntlFlightOrderSureScreen from './IntlFlightOrderSureScreen';
import IntlFlightOrderListScreen from './IntlFlightOrderListScreen';
import IntlFlightOrderDetailScreen from './IntlFlightOrderDetailScreen';
import InflFlightOrderRefundScreen from './InflFlightOrderRefundScreen';
import InflFlightOrderReissueScreen from './InflFlightOrderReissueScreen';
import IntlFlightPaymentScreen from './IntlFlightPaymentScreen';
import IntlFlightListScreen from './IntlFlightListScreen';
import IntlFlightMoreScreen from './IntlFlightMoreScreen';
import IntlFlightRtListScreen from './IntlFlightRtListScreen';
import InflFlight_compCreateOrderScreen from './InflFlight_compCreateOrderScreen';
import IntlEditPassengerScreen from '../common/IntlEditPassengerScreen';//国际的 普通订单
import IntlFlightEditScreen from './IntlFlightEditScreen'; //国际的 普通订单飞机编辑
// import IntlCompEditPassengerScreen from './Intl_compEditPassengerScreen'; //国际的 创建综合订单编辑
import Intl_compFlightEditScreen from './Intl_compFlightEditScreen';//国际 综合订单编辑
import IntFlightRuleScreen from './FlightRuleScreen';
import IntFlightRtRuleScreen from './FlightRtRuleScreen';
import AirlineSelectScreen from './AirlineSelectScreen';

const intlConfig = {
    /**
        * 首页
        */
    IntlFlightIndex: {
        screen: SearchScreen
    },
    IntlFlightSelectCity: {
        screen: IntlFlightCityScreen
    },
    /**
    * 机票最低价列表
    */
    IntlFlightLowPriceList: {
        screen: IntlFlightListScreen
    },
    IntlFlightRtListScreen: {
        screen: IntlFlightRtListScreen
    },
    /**
    * 国际机票筛选
    */
    IntlFlightFilter: {
        screen: IntlFilterScreen
    },
    /**
    * 机票更多价列表
    */
    IntlFlightMorePriceList: {
        screen: IntlFlightMorePriceScreen
    },
    /**
    * 订单填写页
    */
    IntlFlightCreateOrder: {
        screen: InflCreateOrderScreen
    },
    /**
   * 新增／编辑乘客
   */
    IntlFlightEditPassenger: {
        screen: IntlEditPassengerScreen
    },
    IntlFlightOrderSure: {
        screen: IntlFlightOrderSureScreen
    },
  //   IntlCompEditPassengerScreen: {
  //       screen: IntlCompEditPassengerScreen
  //   },
    /**
    * 订单列表
    */
    IntlFlightOrderList: {
        screen: IntlFlightOrderListScreen
    },
    /**
   * 订单详情
   */
    IntlFlightOrderDetail: {
        screen: IntlFlightOrderDetailScreen
    },
    /**
   * 退票申请
   */
    IntlFlightOrderRefund: {
        screen: InflFlightOrderRefundScreen
    },
    /**
    * 改签申请
    */
    IntlFlightOrderReissue: {
        screen: InflFlightOrderReissueScreen
    },
    /**
     * 订单支付页
     */
    IntlFlightPayment: {
        screen: IntlFlightPaymentScreen
    },
    /**
     * 行程展示
     */
    IntlFlightFlights: {
        screen: IntlFlightMoreScreen
    },
    InflFlight_compCreateOrderScreen: {
        screen: InflFlight_compCreateOrderScreen
    },
    IntlFlightEditScreen:{
        screen: IntlFlightEditScreen
    },
    Intl_compFlightEditScreen:{
        screen: Intl_compFlightEditScreen
    },
    IntFlightRuleScreen: {
        screen: IntFlightRuleScreen
    },
    IntFlightRtRuleScreen: {
        screen: IntFlightRtRuleScreen
    },
    AirlineSelectScreen: {
        screen: AirlineSelectScreen
    }
}

for (const key in intlConfig) {
    if (intlConfig.hasOwnProperty(key)) {
        const element = intlConfig[key];
        element.navigationOptions = {
            header: null
        }
    }
}
export default intlConfig;