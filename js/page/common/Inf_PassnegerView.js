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
// import { withNavigation } from 'react-navigation';
import { useNavigation } from '@react-navigation/native';
import NavigationUtils from '../../navigator/NavigationUtils';
class Inf_PassnegerView extends React.Component {

    static propTypes = {
        from: PropTypes.oneOf(['flight', 'train', 'intlFlight', 'car', 'apply']).isRequired,
        employees: PropTypes.array.isRequired,
        travellers: PropTypes.array.isRequired,
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
        const { employees, travellers, from, goFlightData,customerInfo,userInfo,DestinationNationalCode,DepartureNationalCode } = this.props;
        let data = null;
        if (type === 1) {
            data = employees[index];
        } else {
            data = travellers[index];
        }
        let fromTo = '';
        switch (from) {
            case 'flight':
            case 'car':
            case 'apply':
                fromTo = "FlightEditPassenger";
                break;
            case 'train':
                fromTo = 'TrainEditPassenger';
                break;
            case 'intlFlight':
                fromTo = 'Intl_compFlightEditScreen';
                break;
        }

        NavigationUtils.push(this.props.navigation, fromTo, {
            passenger: data, 
            index: type, 
            goFlightData:goFlightData,
            customerInfo:customerInfo,
            userInfo:userInfo,
            DestinationNationalCode:DestinationNationalCode,
            DepartureNationalCode:DepartureNationalCode,
             callBack: (obj) => {
                if (data.cusInsurances) {
                    obj.cusInsurances = data.cusInsurances;
                }
                if (type === 1) {
                    employees[index] = obj;
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
    _renderPassneger = (passengers,type) => {
        const { userInfo, customerInfo, otwThis, from } = this.props;
        let CusInsurances = customerInfo && customerInfo.Addition && customerInfo.Addition.CusInsurances || []
        return (
            passengers&&passengers.map((data, index) => {
                if (!data.cusInsurances && CusInsurances && from === 'flight') {
                    data.cusInsurances = [];
                    CusInsurances.forEach(obj => {
                        data.cusInsurances.push({
                            detail: obj.InsuranceDetail || [],
                            PerPrice: obj.detail && obj.detail[0].SalePrice,
                            AtLeast: obj.ShowMode === 2,
                            show: obj.ShowMode === 1 || obj.ShowMode === 2
                        })
                    })
                }
                if(from === 'intlFlight'&& (data.CertificateType == '身份证'|| data.CertificateType =='Chinese ID Card') ){
                    let PassPort = false //判断是否有护照 默认证件中不含护照
                    let CertificateList =data.Certificates||[]
                         CertificateList.map((item)=>{
                             if(item.Type === 2){
                                 PassPort = true
                                 data.Sex = item.Sex;
                                 data.CertificateExpire = item.Expire;
                                 data.Birthday = item.Birthday;
                                 data.CertificateType = item.TypeDesc;
                                 data.NationalCode = item.NationalCode;
                                 data.NationalName = item.NationalName;
                                 data.CertificateNumber = item.SerialNumber;
                                 data.IssueNationCode = item.IssueNationCode;
                                 data.IssueNationName = item.IssueNationName;
                             }
                         })
                         if(!PassPort && CertificateList &&CertificateList[1]&&CertificateList[1].Type!=1){
                            data.Sex = CertificateList[1].Sex;
                            data.CertificateExpire = CertificateList[1].Expire;
                            data.Birthday = CertificateList[1].Birthday;
                            data.CertificateType = CertificateList[1].TypeDesc;
                            data.NationalCode = CertificateList[1].NationalCode;
                            data.NationalName = CertificateList[1].NationalName;
                            data.CertificateNumber = CertificateList[1].SerialNumber;
                            data.IssueNationCode = CertificateList[1].IssueNationCode;
                            data.IssueNationName = CertificateList[1].IssueNationName;
                         }
                         if(data.CertificateType == '身份证'){
                            data.CertificateType  = '护照';
                            data.CertificateNumber = null;
                            data.CertificateExpire = null;
                            data.Birthday = null;
                            data.CertificateType = null;
                            data.NationalCode = null;
                            data.NationalName = null;
                            data.CertificateNumber = null;
                            data.IssueNationCode = null;
                            data.IssueNationName = null;
                         }
                 }
                 if(!data.Surname){
                    data.Surname = data.LastName
                    data.GivenName = data.FirstName
                }
                return (
                    <View key={index} style={{ backgroundColor: 'white'}}>
                        <TouchableHighlight underlayColor='transparent' onPress={this._editPassengerRowClick.bind(this, index, type)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: Theme.lineColor}}>
                                <View style={{ }}>
                                    {/* <CustomText text={data.Name} /> */}
                                    <View style={{flexDirection:'column'}}> 
                                                <View style={{flexDirection:'row',alignItems:'center',marginTop:10}}>      
                                                    <CustomText text={'英文名' } />
                                                    <CustomText text={'*'} style={{  color:'red',fontSize:18,marginLeft:2,marginTop:2}} />
                                                    <CustomText text={'：' } />
                                                    <CustomText text={data.GivenName?data.GivenName:'请填写英文名'} style={{color:data.GivenName?'black':Theme.darkColor,marginLeft:6}} />
                                                </View> 
                                                <View style={{flexDirection:'row',alignItems:'center',marginTop:10}}>      
                                                    <CustomText text={'英文姓' } />
                                                    <CustomText text={'*'} style={{  color:'red',fontSize:18,marginLeft:2,marginTop:2}} />
                                                    <CustomText text={'：' } />
                                                    <CustomText text={data.Surname?data.Surname:'请填写英文姓'} style={{color:data.Surname?'black':Theme.darkColor,marginLeft:6}}/>
                                                </View>
                                            </View>
                                    {
                                        data.CertificateType?
                                        <View style={{ flexDirection: 'row', marginTop: 10, marginBottom: 15,alignItems:'center',flexWrap:'wrap' }}>
                                            <CustomText style={{ marginTop: 5, marginBottom: 5 }} text={(data.CertificateType+':')} />
                                            <CustomText style={{ marginTop: 5, marginBottom: 5,marginLeft:6 }} text={(userInfo.Id == data.Id ? (data.CertificateNumber ? data.CertificateNumber : '') : Utils.Read.simpleReplace(data.CertificateNumber))} />
                                        </View>
                                        :
                                        <CustomText style={{ marginTop: 10, marginBottom: 15,color:'red' }} text={'请选择证件类型'} />
                                    }                                     
                                </View>
                                <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                                    <Ionicons name={'chevron-forward'} size={20} color={'lightgray'} />
                                </View>
                            </View>
                        </TouchableHighlight>
                        {/* {
                            data.cusInsurances && data.cusInsurances.length > 0 ?
                                data.cusInsurances.map((item, index) => {
                                    return (
                                        <TouchableHighlight key={index} underlayColor='transparent' disabled={item.AtLeast} onPress={this._InsuranceSelectBtnclick.bind(this, item)}><View>
                                            <View style={{ marginLeft: 20, backgroundColor: Theme.lineColor, height: 1, marginTop: 5 }}></View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', height: 35 }}>
                                                {
                                                    item.detail.length > 0 ?
                                                        <CustomText style={{ marginLeft: 10, color: 'gray' }} text={Utils.Parse.isChinese()? item.detail[0].ProductName :item.detail[0].ProductEnName?item.detail[0].ProductEnName:item.detail[0].ProductName} />
                                                        : null
                                                }
                                                <TouchableHighlight underlayColor='transparent' onPress={this._showInsuranceContentClick.bind(this, item)}>
                                                    <AntDesign name={'questioncircle'} size={18} color={Theme.theme} style={{ marginLeft: 5 }} />
                                                </TouchableHighlight>
                                                <CustomText style={{ marginLeft: 5, color: 'orange' }} text={`¥${item.detail?.[0]?.SalePrice ?? 0}*1/${I18nUtil.translate('份')}`} />
                                                <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 10 }}>
                                                    <MaterialIcons
                                                        name={item.show ? 'check-box' : 'check-box-outline-blank'}
                                                        size={28}
                                                        color={Theme.darkColor}
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                        </TouchableHighlight>
                                    )
                                })
                                : null
                        } */}
                    </View>
                )
            })
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
                            <CustomText style={{ fontWeight: 'bold' }} text={'员工'} />
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
                                    <CustomText style={{ fontWeight: 'bold' }} text='常旅客' />
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
// export default withNavigation(Inf_PassnegerView);
export default function(props) {
    const navigation = useNavigation();
    return (
        <Inf_PassnegerView {...props} navigation={navigation} />
    )
}
const styles = StyleSheet.create({
    view: {
        marginTop: 0,
        backgroundColor: 'white'

    },
    section: {
        height: 44,
        paddingHorizontal: 10,
        flexDirection: "row",
        justifyContent: 'space-between',
        alignItems: "center"
    }
})