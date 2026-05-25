
import CompCreateOrderScreen from './CompCreateOrderScreen';
// import CompChooseObjectScreen from './CompChooseObjectScreen';
import ComprehensiveListScreen from './ComprehensiveListScreen';
// import CompAddpersonsScreen from './CompAddpersonsScreen';
import CompDetailScreen from './CompDetailScreen';
import CompPaymentScreen from './CompPaymentScreen'
import EmployeesScreen from './EmployeesScreen'
// import JourneyScreen from './JourneyScreen'
import ApprovalScreen from '../home/ApprovalScreen'
import PresonalScreen from '../home/PresonalScreen'
import PayListScreen from '../home/PayListScreen'


const ComprehensiveConfig = {
    CompCreateOrderScreen: {
        screen: CompCreateOrderScreen
    },
    // CompChooseObjectScreen: {
    //     screen: CompChooseObjectScreen
    // },
    ComprehensiveListScreen: {
        screen: ComprehensiveListScreen
    },
    // CompAddpersonsScreen: {
    //     screen: CompAddpersonsScreen
    // },
    CompDetailScreen: {
        screen: CompDetailScreen
    },
    CompPaymentScreen: {
        screen: CompPaymentScreen
    },
    EmployeesScreen:{
        screen: EmployeesScreen
    },
    // Journey: {
    //     screen: JourneyScreen,
    // },
    Approval: {
        screen: ApprovalScreen,
    },
    Personal: {
        screen: PresonalScreen,
    },
    PayListScreen:{
        screen:PayListScreen,
    }
   
}

for (const key in ComprehensiveConfig) {
    if (ComprehensiveConfig.hasOwnProperty(key)) {
        const element = ComprehensiveConfig[key];
        element.navigationOptions = {
            header: null
        }
    }
}

export default ComprehensiveConfig;