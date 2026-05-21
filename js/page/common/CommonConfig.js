import WebViewScreen from './WebViewScreen';
import CalendarScreen from './CalendarScreen';
import RuleReasonSelect from './RuleReasonSelect';
import PassnegerListScreen from './PassnegerListScreen';
import ProjectScreen from './ProjectScreen';
import DicListScreen from './DicListScreen';
// import ApproverListScreen from './ApproverListScreen';
import NationCityScreen from './NationCityScreen';
// import PdfDisplayScreen from './PdfDisplayScreen';
// import BindMobileScreen from './BindMobileScreen';
// import NoticeCenterScreen  from '../home/NoticeCenterScreen';
import NoticeListScreen from '../home/NoticeListScreen';
// import GuranteeCardScreen from './GuranteeCardScreen';
import CancalAccountScreen from '../home/CancalAccountScreen';
// import TravelBookScreen from '../home/TravelBookScreen';
// import TravelBookHotelScreen from '../home/TravelBookHotelScreen'
// import ChooseSinglePersonList from './ChooseSinglePersonList';
// import CompEditPassengerScreen from '../ComprehensiveOrder/CompEditPassengerScreen';
import TaverlerCreditCardScreen from '../personal/TaverlerCreditCardScreen';
import NewNoticeCenterScreen from '../home/NewNoticeCenterScreen';
import NoticeDetailScreen from '../home/NoticeDetailScreen';
const common = {
    Web: {
        screen: WebViewScreen
    },
    Calendar: {
        screen: CalendarScreen
    },
    RuleReasonSelect: {
        screen: RuleReasonSelect
    },
    PassengerViewScreen: {
        screen: PassnegerListScreen
    },
    ProjectScreen: {
        screen: ProjectScreen
    },
    // GuranteeCardScreen: {
    //     screen: GuranteeCardScreen
    // },
    DicList: {
        screen: DicListScreen
    },
    // ChooseSinglePersonList: {
    //     screen: ChooseSinglePersonList,
    // },
    // ApproverList: {
    //     screen: ApproverListScreen
    // },
    NationalCity: {
        screen: NationCityScreen
    },
    // PdfDisplay: {
    //     screen: PdfDisplayScreen
    // },
    // BindMobile: {
    //     screen: BindMobileScreen
    // },
    // NoticeCenter:{
    //     screen:NoticeCenterScreen
    // },
    NewNoticeCenterScreen:{
        screen:NewNoticeCenterScreen
    },
    NoticeCenterDetail:{
        screen:NoticeListScreen
    },
    CancalAccount:{
        screen:CancalAccountScreen
    },
    // TravelBookScreen:{
    //     screen: TravelBookScreen
    // },
    // TravelBookHotelScreen:{
    //     screen: TravelBookHotelScreen
    // },
    // CompEditPassengerScreen:{
    //     screen: CompEditPassengerScreen
    // },
    TaverlerCreditCardScreen:{
        screen: TaverlerCreditCardScreen
    },
    MessageNoticeDetail:{
        screen: NoticeDetailScreen
    }
}

for (const key in common) {
    if (common.hasOwnProperty(key)) {
        const element = common[key];
        element.navigationOptions = {
            header: null
        }
    }
}

export default common;