
import HotelIndexScreen from './HotelIndexScreen';
import HotelCityScreen from './HotelCityScreen';
import HotelListScreen from './HotelListScreen';
import HotelRoomListScreen from './HotelRoomListScreen';
import HotelRoomPicScreen from './HotelRoomPicScreen';
import HotelRoomPicItemView from './HotelRoomPicItemView';
import HotelRoomPicIDetailView from './HotelRoomPicIDetailView';
import HotelFilterScreen from './HotelFilterScreen';
import HotelCreateOrderScreen from './HotelCreateOrderScreen';
import HotelInstroScreen from './HotelInstroScreen';
import HotelRuleScreen from './HotelRuleScreen';
// import HotelAddPassenegrScreen from './HotelAddPassenegrScreen';
import HotelOrderSureScreen from './HotelOrderSureScreen';
import HotelGuaranteeScreen from './HotelGuaranteeScreen';
import HotelGuaranteeScreen2 from './HotelGuaranteeScreen2';
import HotelOrderListScreen from './HotelOrderListScreen';
import HotelOrderDetailScreen from './HotelOrderDetailScreen';
import HotelPaymentScreen from './HotelPaymentScreen';
import HotelEditPassengerScreen from './HotelEditPassengerScreen';
import HotelCompEditPassengerScreen from './HotelCompEditPassengerScreen';
import Hotel_comp_CreateOrderScreen from './Hotel_comp_CreateOrderScreen';
import HotelChoosePersonScreen from './HotelChoosePersonScreen';
import HotelSelectCardScreen from './HotelSelectCardScreen';
import HotelGuranteeMessageVertifyScreen from './HotelGuranteeMessageVertifyScreen';
import ChooseLivePersonScreen from './ChooseLivePersonScreen';
import TestScreen from './TestScreen';
import HotelAddPersonEditScreen from './HotelAddPersonEditScreen';
import CvvScreen from './CvvScreen';
import HotelScreen from './HotelScreen';

const hotelConfig = {
    Hotel: {
        screen: HotelScreen
    },
    HotelSearchIndex: {
        screen: HotelIndexScreen
    },
    HotelCity: {
        screen: HotelCityScreen
    },
    HotelList: {
        screen: HotelListScreen
    },
    HotelRoomList: {
        screen: HotelRoomListScreen
    },
    HotelFilter: {
        screen: HotelFilterScreen
    },
    HotelRule: {
        screen: HotelRuleScreen
    },
    HotelOrder: {
        screen: HotelCreateOrderScreen
    },
    HotelOrderSure: {
        screen: HotelOrderSureScreen
    },
    HotelInstrotuction: {
        screen: HotelInstroScreen
    },
    // HotelAddPassenger: {
    //     screen: HotelAddPassenegrScreen
    // },
    HotelGuarantee: {
        screen: HotelGuaranteeScreen
    },
    HotelGuarantee2: {
        screen: HotelGuaranteeScreen2
    },
    HotelOrderListScreen: {
        screen: HotelOrderListScreen
    },
    HotelOrderDetailScreen: {
        screen: HotelOrderDetailScreen
    },
    HotelPayment: {
        screen: HotelPaymentScreen
    },
    HotelRoomPic: {
        screen: HotelRoomPicScreen
    },
    HotelRoomPicItem: {
        screen: HotelRoomPicItemView
    },
    HotelRoomPicIDetail: {
        screen: HotelRoomPicIDetailView
    },
    HotelEditPassengerScreen: {
        screen: HotelEditPassengerScreen
    },
    HotelCompEditPassengerScreen: {
        screen: HotelCompEditPassengerScreen
    },
    Hotel_comp_CreateOrderScreen: {
        screen: Hotel_comp_CreateOrderScreen
    },
    HotelChoosePersonScreen: {
        screen:HotelChoosePersonScreen
    },
    HotelSelectCardScreen:{
        screen:HotelSelectCardScreen
    },
    HotelGuranteeMessageVertify:{
        screen:HotelGuranteeMessageVertifyScreen
    },
    ChooseLivePersonScreen:{
        screen: ChooseLivePersonScreen
    },
    TestScreen:{
        screen: TestScreen
    },
    HotelAddPersonEditScreen:{
        screen: HotelAddPersonEditScreen
    },
    CvvScreen:{
        screen: CvvScreen
    }
}


for (const key in hotelConfig) {
    if (hotelConfig.hasOwnProperty(key)) {
        const element = hotelConfig[key];
        element.navigationOptions = {
            header: null
        }
    }
}

export default hotelConfig;