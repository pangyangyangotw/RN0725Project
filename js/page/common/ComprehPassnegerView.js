import React from 'react';
import {
    View,
    StyleSheet,
    TouchableHighlight,
    Image
} from 'react-native';
import Theme from '../../res/styles/Theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import CustomText from '../../custom/CustomText';
import PropTypes from 'prop-types';
import Utils from '../../util/Util';
import Ionicons from 'react-native-vector-icons/Ionicons';
import I18nUtil from '../../util/I18nUtil';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import NavigationUtils from '../../navigator/NavigationUtils';
class ComprehPassnegerView extends React.Component {

    static propTypes = {
        from: PropTypes.oneOf(['flight', 'train', 'intlFlight', 'car', 'apply']).isRequired,
        employees: PropTypes.array.isRequired,
        userInfo: PropTypes.object.isRequired,
        customerInfo: PropTypes.object.isRequired,
        otwThis: PropTypes.object.isRequired
    }
    constructor(props) {
        super(props);
    }
    /**
     * 添加员工或常旅客方法
     */
    _addPerson=(index)=>{
        const { from, employees, travellers, otwThis } = this.props;
        if (from === 'car') {
            if (employees.length + travellers.length > 0) {
                otwThis.toastMsg('只能添加一个预订人');
                return;
            }
        }
        NavigationUtils.push(this.props.navigation, 'PassengerViewScreen', {
            title: index === 1 ? '选择其他员工' : '选择常用旅客',
            from: this.props.from,
            passengers: index === 1 ? this.props.employees : this.props.travellers,
            callBack: (passengers) => {
                passengers.forEach(item => {
                    let traveller = (index === 1 ? this.props.employees : this.props.travellers);
                    let atIndex = traveller.findIndex(obj => ((obj.Id === item.Id) && item.Id) || ((obj.Name===item.Name) && (obj.CertificateNumber === item.CertificateNumber)));
                    if (atIndex === -1) {
                        traveller.push(item);
                    }
                })
                this.props.otwThis.setState({});
            }
        })
    }

    /**
     * 
     * @param {添加员工或常旅客} index 
     */
    _addPassenger = (index) => {
        const { userInfo,otwThis } = this.props;
        if((userInfo.Permission&3)===3){
           this._addPerson(index)
        }else if((userInfo.Permission&8)===8){
           if(index===1){
            this._addPerson(index)
           }else{
            otwThis.toastMsg('没有为常旅客预订的权限');
           } 
        }else{
            otwThis.toastMsg('没有为员工和常旅客预订的权限');
        }
    } 
    /**
     *  编辑乘客信息
     */
    _editPassengerRowClick = (index, type) => {
        const { employees, travellers, from, goFlightData,backFlightData,customerInfo,userInfo } = this.props;
        let data;
        if (type === 1) {
            data = employees&&employees.length>0 ? employees[index] : null;
        } else {
            data = travellers&&travellers.length>0 ? travellers[index] : null;
        }
        let fromTo = '';
        switch (from) {
            case 'flight':
            case 'car':
            case 'apply':
                fromTo = "FlightCompEditPassengerScreen";//综合订单飞机编辑页
                break;
            case 'train':
                fromTo = 'TrainComp_EditPassengerScreen';
                break;
            case 'intlFlight':
                fromTo = 'IntlFlightEditScreen';
                break;
        }

        NavigationUtils.push(this.props.navigation, fromTo, {
            passenger: data, 
            index: type, 
            goFlightData:goFlightData, 
            backFlightData:backFlightData,
            customerInfo:customerInfo,
            userInfo:userInfo, 
            callBack: (obj) => {
                if (data.cusInsurances) {
                    obj.cusInsurances = data.cusInsurances;
                }
                if (type === 1) {
                    employees[index] = obj;
                    if(obj.Mobile && obj.CertificateNumber && (obj.SexDesc || obj.Sex)){
                        obj.highLight=false
                    }
                } else {
                    travellers[index] = obj;
                }
                this.setState({});
            }
        });
    }
    /** 
     *  删除乘客信息
     */
    _deletePasserngerClick = (index, type) => {
        if (type === 1) {
            this.props.employees.splice(index, 1);
        } else {
            this.props.travellers.splice(index, 1);
        }
        this.props.otwThis.setState({});
    }

    /**
     *  选择不选保险
     */
    _InsuranceSelectBtnclick = (item) => {
        item.show = !item.show;
        this.props.otwThis.setState({});
    }
    /**
     *  展示保险内容
     */
    _showInsuranceContentClick = (item) => {
        if (!item || !item.detail || item.detail.length === 0) return;
        const { otwThis } = this.props;
        otwThis.showAlertView(item.detail[0].InsuranceDesc);
    }
    _renderPassneger = (passengers, type) => {
        const { userInfo, customerInfo, otwThis, from } = this.props;
        let CusInsurances = customerInfo && customerInfo.Addition && customerInfo.Addition.CusInsurances || []
        return (
            <View style={{ backgroundColor: 'white'}}>
                { passengers&&passengers.map((data, index) => {
                    if (!data.cusInsurances && CusInsurances && from === 'flight') {
                        data.cusInsurances = [];
                        CusInsurances&&CusInsurances.forEach(obj => {
                            data.cusInsurances.push({
                                detail: obj.InsuranceDetail || [],
                                PerPrice: obj.detail && obj.detail[0].SalePrice,
                                AtLeast: obj.ShowMode === 2,
                                show: obj.ShowMode === 1 || obj.ShowMode === 2,
                                Count:obj.Count
                            })
                        })
                    }
                    let CHName = data.CertificateType==="身份证" || data.CertificateType==="Chinese ID Card" || ((data.CertificateType==="海员证" || data.CertificateType==="Seaman's Book")&&data.NationalCode==="CN")|| data.CertificateType==="港澳台居民居住证"|| data.CertificateType==="Residence Permit for Hong Kong,Macau and Taiwan Residents"
                    let CHName2 = (data.CertificateType==="护照" || data.CertificateType==="Passport") && data.NationalCode==="CN"
                    let selcetName = ((from === 'flight' && data.selcetName) || ( from === 'train' && !data.selectEn)) && Utils.Read.certificateType2(data.CertificateType) === 128
                    return (
                        <View key={index} style={styles.viewStyle}>
                            <TouchableHighlight underlayColor='transparent' onPress={this._editPassengerRowClick.bind(this, index, type)}>
                                <View style={{ flexDirection: 'row',  alignItems: 'center', borderTopColor: Theme.lineColor, borderTopWidth: 1, paddingHorizontal: 10}}>
                                    <View style={{ }}>
                                        {
                                            CHName || CHName2 ||selcetName?
                                            <CustomText text={data.Name}  style={{ paddingVertical: 10}}/>
                                            :
                                            <View style={{flexDirection:'column'}}> 
                                                <View style={{flexDirection:'row',alignItems:'center'}}>      
                                                    <CustomText text={'英文名' } />
                                                    <CustomText text={'*'} style={{  color:'red',fontSize:24,marginLeft:2}} />
                                                    <CustomText text={'：' } />
                                                    <CustomText text={data.GivenName?data.GivenName:'请填写英文名'} style={{color:data.GivenName?'black':Theme.darkColor}} />
                                                </View> 
                                                <View style={{flexDirection:'row',alignItems:'center'}}>      
                                                    <CustomText text={'英文姓' } />
                                                    <CustomText text={'*'} style={{  color:'red',fontSize:24,marginLeft:2}} />
                                                    <CustomText text={'：' } />
                                                    <CustomText text={data.Surname?data.Surname:'请填写英文姓'} style={{color:data.Surname?'black':Theme.darkColor}}/>
                                                </View>
                                            </View>
                                        }
                                        {
                                            data.CertificateType?
                                            <View style={{ flexDirection: 'row',flexWrap:'wrap' }}>
                                                {/* <CustomText style={{ numberOfLines:0}} text={(data.CertificateType)} /> */}
                                                <CustomText style={{ height:35,alignItems:'center',marginLeft:2}} text={Utils.Read.simpleReplace(data.CertificateNumber)} />
                                            </View>:
                                            <CustomText style={{ color:'red' }} text={'请选择证件类型'} />
                                        }                                   
                                    </View>
                                    <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                                        <Ionicons name={'chevron-forward'} size={22} color={'lightgray'} />
                                    </View>
                                </View>
                            </TouchableHighlight>
                        </View>
                    )
                  })
                }
          </View>
        )
    }
    
  
    render() {
        const { employees, travellers, customerInfo, from } = this.props;
        if (!customerInfo || !customerInfo.Addition) return null;
        let employeesArr = JSON.parse(JSON.stringify(employees))
        return (
            <View>
                {/* {from !== 'car' ? <View style={styles.view}>
                    <TouchableHighlight underlayColor='transparent' onPress={this._addPassenger.bind(this, 1)}>
                        <View style={styles.section}>
                            <CustomText style={{ fontWeight: 'bold' }} text={'为其他员工预订'} />
                            <AntDesign name={'adduser'} size={26} color={Theme.theme} />
                        </View>
                    </TouchableHighlight>
                </View> : null
                } */}
                {
                    <View style={{flexDirection:'row',marginHorizontal:10,alignItems:'center',paddingVertical:10}}> 
                        <Image source={require('../../res/Uimage/shu.png')} style={{width:14,height:14}}/>
                        <CustomText style={{ fontSize:14,fontWeight:'bold' }} text={'出差人'} />
                    </View> 
                }
                {
                    this._renderPassneger(employees, 1)
                }
                {/* {  this._renderPassneger(employeesArr.concat(travellers), 1)  } */}
                {/* {
                    from !== 'car' ?
                        <View style={styles.view}>
                            <TouchableHighlight underlayColor='transparent' onPress={this._addPassenger.bind(this, 2)}>
                                <View style={styles.section}>
                                    <CustomText style={{ fontWeight: 'bold' }} text='为常旅客预订(非员工)' />
                                    <AntDesign name={'adduser'} size={26} color={Theme.theme} />
                                </View>
                            </TouchableHighlight>
                        </View>
                        : null
                } */}
                {
                    this._renderPassneger(travellers, 2)
                }
            </View>
        )
    }
}

export default function(props) {
    const navigation = useNavigation();
    return <ComprehPassnegerView {...props} navigation={navigation} />
}

const styles = StyleSheet.create({
    view: {
        marginTop: 5,
        backgroundColor: 'white'

    },
    section: {
        height: 44,
        paddingHorizontal: 10,
        flexDirection: "row",
        justifyContent: 'space-between',
        alignItems: "center"
    },
    viewStyle1:{ 
        backgroundColor: 'white',
        // marginTop:9,
        // marginHorizontal:10,
        borderRadius:6
    },
    viewStyle:{ 
        backgroundColor: 'white',
        // borderWidth:1,
        // borderColor:'red' ,
        // marginHorizontal:6,
        borderRadius:6
    }
})