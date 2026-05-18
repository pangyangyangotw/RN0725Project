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
import Util from '../../util/Util';

class PassengerView extends React.Component {

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
        const { from, employees, travellers, otwThis, customerInfo } = this.props;
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
                        let CertificateList = []
                        if(item.Certificate){//添加证件有效期
                            CertificateList = JSON.parse(item.Certificate)
                            if(!item.IssueNationCode){
                                item.IssueNationCode = CertificateList[0].IssueNationCode?CertificateList[0].IssueNationCode:null
                                item.IssueNationName = CertificateList[0].IssueNationName?CertificateList[0].IssueNationName:null
                            }
                            if(!item.CertificateExpire){
                                item.CertificateExpire = CertificateList[0].Expire?CertificateList[0].Expire:null
                            }
                        }

                        if(!item.AdditionInfo){
                           item.AdditionInfo = item.AdditionDict
                        }
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
        const { employees, from, goFlightData,backFlightData, customerInfo,userInfo,noComp,travellers } = this.props;
        let data = null;
        if (type === 1) {
            data = employees[index];
        } 
        else {
            data = travellers[index];
            data.Certificate = data.CertificateList
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
            noComp:noComp,
            from:from,
            callBack: (obj) => {
                if (data.cusInsurances) {
                    obj.cusInsurances = data.cusInsurances;
                }
                if (type === 1) {
                    employees[index] = obj;
                    if(obj.Mobile && obj.CertificateNumber && (obj.SexDesc || obj.Sex)){
                        obj.highLight=false
                    }
                } 
                else {
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
        const { userInfo, customerInfo, otwThis, from ,feeType} = this.props;
        let CusInsu = feeType==2? customerInfo && customerInfo.Addition && customerInfo.Addition.PersonalInsurances :customerInfo && customerInfo.Addition && customerInfo.Addition.CusInsurances
        let CusInsurances = CusInsu || []
        return (
            passengers&&passengers.map((data, index) => {
                if (!data.cusInsurances && CusInsurances && from === 'flight') {
                    data.cusInsurances = [];
                    CusInsurances.forEach(obj => {
                        data.cusInsurances.push({
                            detail: obj.InsuranceDetail || [],
                            PerPrice: obj.detail && obj.detail[0].SalePrice,
                            AtLeast: obj.ShowMode === 2,
                            show: obj.ShowMode === 1 || obj.ShowMode === 2,
                            Count:obj.Count
                        })
                    })
                }
                let cusInsurances = data.cusInsurances
                if(from === 'intlFlight' && data.CertificateType == '身份证' ){
                   let PassPort = false //判断是否有护照 默认证件中不含护照
                   let CertificateList =data.Certificate? 
                                            typeof(data.Certificate)=='string'?JSON.parse(data.Certificate):[data.Certificate]
                                            :
                                            data.CertificateList ? JSON.parse(data.CertificateList):[]
                        CertificateList.map((item)=>{
                            if(item.Type === 2){
                                PassPort = true
                                // data.Sex = item.Sex;
                                data.CertificateExpire = item.Expire;
                                // data.Birthday = item.Birthday;
                                data.CertificateType = item.TypeDesc;
                                // data.NationalityCode = item.NationalCode;
                                // data.Nationality = item.NationalName;
                                data.CertificateNumber = item.SerialNumber;
                                data.IssueNationCode = item.IssueNationCode;
                                data.IssueNationName = item.IssueNationName;
                            }
                        })
                        if(!PassPort && CertificateList &&CertificateList[1]&&CertificateList[1].Type!=1){
                            // data.Sex = CertificateList[1].Sex;
                            data.CertificateExpire = CertificateList[1].Expire;
                            // data.Birthday = CertificateList[1].Birthday;
                            data.CertificateType = CertificateList[1].TypeDesc;
                            // data.NationalCode = CertificateList[1].NationalCode;
                            // data.NationalName = CertificateList[1].NationalName;
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
                if(from === 'train'&& !(Util.Read.certificateType2(data.CertificateType)==1||Util.Read.certificateType2(data.CertificateType)==2||Util.Read.certificateType2(data.CertificateType)==4||Util.Read.certificateType2(data.CertificateType)==1024||Util.Read.certificateType2(data.CertificateType)==512||Util.Read.certificateType2(data.CertificateType)==128)){
                    let IDcar = false //判断是否有护照 默认证件中不含护照
                    let CertificateList =data.Certificate? 
                                             typeof(data.Certificate)=='string'?JSON.parse(data.Certificate):[data.Certificate]
                                             :
                                             data.CertificateList ? JSON.parse(data.CertificateList):[]
                         CertificateList.map((item)=>{
                             if(item.Type === 1){
                                IDcar = true
                                //  data.Sex = item.Sex;
                                 data.CertificateExpire = item.Expire;
                                 // data.Birthday = item.Birthday;
                                 data.CertificateType = item.TypeDesc;
                                 // data.NationalityCode = item.NationalCode;
                                 // data.Nationality = item.NationalName;
                                 data.CertificateNumber = item.SerialNumber;
                                 data.IssueNationCode = item.IssueNationCode;
                                 data.IssueNationName = item.IssueNationName;
                             }
                         })
                         if(!IDcar && CertificateList &&CertificateList[1]){
                            //  data.Sex = CertificateList[1].Sex;
                             data.CertificateExpire = CertificateList[1].Expire;
                             // data.Birthday = CertificateList[1].Birthday;
                             data.CertificateType = CertificateList[1].TypeDesc;
                             // data.NationalCode = CertificateList[1].NationalCode;
                             // data.NationalName = CertificateList[1].NationalName;
                             data.CertificateNumber = CertificateList[1].SerialNumber;
                             data.IssueNationCode = CertificateList[1].IssueNationCode;
                             data.IssueNationName = CertificateList[1].IssueNationName;
                          }
                 }
                 if(!data.Surname){
                    data.Surname = data.LastName
                    data.GivenName = data.FirstName
                 }
                 if(!data.LastName){
                    data.LastName = data.Surname
                    data.FirstName = data.GivenName
                 }
                let CHName = data.CertificateType==="身份证" || data.CertificateType==="Chinese ID Card" || ((data.CertificateType==="海员证" || data.CertificateType==="Seaman's Book")&&data.NationalCode==="CN")|| data.CertificateType==="港澳台居民居住证"|| data.CertificateType==="Residence Permit for Hong Kong,Macau and Taiwan Residents"
                let CHName2 = (data.CertificateType==="护照" || data.CertificateType==="Passport") && data.NationalCode==="CN"
                let selcetName = data.selcetName && Utils.Read.certificateType2(data.CertificateType) === 128
                let trainPassenger = from === 'train' && Util.Read.certificateType2(data.CertificateType)!=1024
                return (
                    <View key={index} style={data.highLight?styles.viewStyle2:styles.viewStyle1}>
                        <TouchableHighlight underlayColor='transparent' onPress={this._editPassengerRowClick.bind(this, index, type, cusInsurances)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, borderBottomWidth:1,borderColor:Theme.lineColor  }}>
                                    <View style={{ }}>
                                        {/* {
                                            (data.FirstName&&data.LastName&& (!Util.Parse.isChinese()))?<CustomText text={data.FirstName+data.LastName} />:<CustomText text={data.Name} />
                                        } */}
                                        { CHName || CHName2 || selcetName || trainPassenger  ?
                                            <View style={{flexDirection:'row',alignItems:'center',paddingVertical:10}}>      
                                                <CustomText text={data.Name?data.Name:'请填写姓名'} style={{color:data.Name?'black':Theme.darkColor}} />
                                            </View>: 
                                            <View style={{flexDirection:'column'}}> 
                                                    <View style={{flexDirection:'row',alignItems:'center'}}>      
                                                        <CustomText text={'英文名' } />
                                                        <CustomText text={'*'} style={{  color:'red',fontSize:24,marginLeft:2}} />
                                                        <CustomText text={'：' } />
                                                        <CustomText text={data.FirstName?data.FirstName:'请填写英文名'} style={{color:data.FirstName?'black':Theme.darkColor}} />
                                                    </View> 
                                                    <View style={{flexDirection:'row',alignItems:'center'}}>      
                                                        <CustomText text={'英文姓' } />
                                                        <CustomText text={'*'} style={{  color:'red',fontSize:24,marginLeft:2}} />
                                                        <CustomText text={'：' } />
                                                        <CustomText text={data.LastName?data.LastName:'请填写英文姓'} style={{color:data.LastName?'black':Theme.darkColor}}/>
                                                    </View>
                                            </View> 
                                        }
                                        {
                                            data.CertificateType?
                                            <View style={{}}>
                                                {/* <CustomText style={{ paddingVertical:10}} text={(data.CertificateType)} /> */}
                                                <View style={{flexDirection:'row'}}>
                                                {/* <CustomText style={{ paddingVertical:10}} text={'证件号：'} /> */}
                                                {/* <CustomText style={{}} text={(userInfo.Id == data.Id ? (data.CertificateNumber ? data.CertificateNumber : '') : Utils.Read.simpleReplace(data.CertificateNumber))} /> */}
                                                <CustomText style={{}} text={data.CertificateNumber ?(Utils.Read.simpleReplace(data.CertificateNumber)):''} />
                                                </View>
                                            </View>
                                            :
                                            <CustomText style={{ marginTop: 10, marginBottom: 5,color:'red' }} text={'请选择证件类型'} />
                                        }                                    
                                    </View>
                                    <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                                        <Ionicons name={'ios-arrow-forward'} size={20} color={'lightgray'} />
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
                                                        <CustomText style={{ marginLeft: 10, color: 'gray' }} text={item.detail[0].ProductName} />
                                                        : null
                                                }
                                                <TouchableHighlight underlayColor='transparent' onPress={this._showInsuranceContentClick.bind(this, item)}>
                                                    <AntDesign name={'questioncircle'} size={22} color={Theme.theme} style={{ marginLeft: 5 }} />
                                                </TouchableHighlight>
                                                <CustomText style={{ marginLeft: 5, color: Theme.theme }} text={'¥' + item.detail[0].SalePrice + '*'+item.Count+'/' + I18nUtil.translate('份')} />
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
        if (!customerInfo || !customerInfo.Addition) return null
        let employeesArr = JSON.parse(JSON.stringify(employees))
        return (
            <View style={{ backgroundColor: 'white', marginTop:10, paddingBottom:10, marginHorizontal:10, borderRadius:6}}>
                <View style={{flexDirection:'row',marginHorizontal:20,alignItems:'center',paddingVertical:10,borderBottomWidth:1,borderColor:Theme.lineColor}}> 
                    <Image source={require('../../res/Uimage/shu.png')} style={{width:14,height:14}}/>
                    <CustomText style={{ fontSize:14,fontWeight:'bold' }} text={'出差人'} />
                </View> 
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
            </View>
            
        )
    }
}
// 使用 Hook 包装类组件以获取 navigation
export default function(props) {
    const navigation = useNavigation();
    return <PassengerView {...props} navigation={navigation} />
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
    },
    viewStyle1:{ 
        backgroundColor: '#fff',
        // marginTop:10,
        marginHorizontal:10,
        borderRadius:6,
    },
    viewStyle2:{ 
        backgroundColor: 'white',
        borderWidth:1,
        marginTop:3,
        borderColor:'red' ,
        marginHorizontal:6,
        borderRadius:6,
        paddingHorizontal:10,
        marginHorizontal:10
    }
})