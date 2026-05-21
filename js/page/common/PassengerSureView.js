import React from 'react';
import {
    View,
    StyleSheet,
    TouchableHighlight
} from 'react-native';
import CustomText from '../../custom/CustomText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Theme from '../../res/styles/Theme';
import PropTypes from 'prop-types';
import Util from '../../util/Util';
import I18nUtil from '../../util/I18nUtil';
import { connect } from 'react-redux'
class PassengerSureView extends React.Component {

    static propTypes = {
        PassengerList: PropTypes.array.isRequired,
        approverList: PropTypes.array,
        customerInfo: PropTypes.object.isRequired,
        feeType: PropTypes.number.isRequired,
        from: PropTypes.string.isRequired,
        PaymenType: PropTypes.number
    }

    constructor(props) {
        super(props);
        this.state = {
            isShow: true
        }
    }
    _showDetail = () => {
        this.setState({
            isShow: !this.state.isShow
        })
    }
    render() {
        const { isShow } = this.state;
        const { PassengerList, ApproveList, customerInfo, feeType, from, PaymenType, IsNeedIDCard, compSwitch,fromNo,from2 } = this.props;
        let isHideAttribute = customerInfo && customerInfo.Setting && customerInfo.Setting.IsHiddenDepartment && customerInfo.Setting.IsHiddenProject;
        return (
            <View style={{marginHorizontal:10, borderRadius:6,backgroundColor: 'white', marginTop:10}}>
                {
                    isShow ?
                        PassengerList && PassengerList.map((item, index) => {
                            let Approver = null;
                            let approPeople = '';
                            if (ApproveList) {
                                if (ApproveList.length === PassengerList.length) {
                                    Approver = ApproveList[index];
                                } else {
                                    Approver = ApproveList[0];
                                }
                                if (Approver.ApproveList) {
                                    if (Approver.ApproveList.length > 0) {
                                        Approver.ApproveList.forEach(obj => {
                                            approPeople += ' ' + obj.ApprovePersonName;
                                        })
                                    } else {
                                        approPeople = '免审';
                                    }
                                }
                            }
                            let obj;
                            if (IsNeedIDCard && IsNeedIDCard == true) {
                                if (item.CertificateId == 1) {
                                    obj = item.CertificateNumber
                                } else {
                                    if (item.Certificate && typeof (item.Certificate) === 'string') {
                                        let CertificateList = JSON.parse(item.Certificate) || [];
                                        let objs = CertificateList.find(item => item.Type === 1);
                                        obj = objs && objs.SerialNumber;
                                    } else {
                                    }
                                }
                            }
                            return (
                                <View key={index} style={styles.row}>
                                    {
                                        from2==='intlhotel' || item?.Certificate?.UseEnglish===true || fromNo === 32 || item?.Credentials?.UseEnglish===true?
                                        <View style={{flexDirection:'column'}}> 
                                            <View style={{flexDirection:'row',alignItems:'center'}}>      
                                                <CustomText text={'英文名' } />
                                                <CustomText text={'*'} style={{  color:'red',fontSize:24,marginLeft:2}} />
                                                <CustomText text={'：' } />
                                                <CustomText text={item.GivenName?item.GivenName:'请填写英文名'} style={{color:item.GivenName?'black':Theme.darkColor}} />
                                            </View> 
                                            <View style={{flexDirection:'row',alignItems:'center'}}>      
                                                <CustomText text={'英文姓' } />
                                                <CustomText text={'*'} style={{  color:'red',fontSize:24,marginLeft:2}} />
                                                <CustomText text={'：' } />
                                                <CustomText text={item.Surname?item.Surname:'请填写英文姓'} style={{color:item.Surname?'black':Theme.darkColor}}/>
                                            </View>
                                        </View> 
                                        :
                                        <CustomText text={item.Name} style={{ flex: 3 }} />
                                    }
                                    <View style={{ flex: 7 }}>
                                        {
                                          from==='hotel'? null
                                          :
                                            IsNeedIDCard ?
                                                from === 'flight'?
                                                <CustomText  text={I18nUtil.translate(Util.Read.typeTocertificate2(item.Certificate && item.Certificate.Type)) + '：' + Util.Read.simpleReplace(obj)} />
                                                :
                                                <CustomText  text={I18nUtil.translate(Util.Read.typeTocertificate(item.Certificate && item.Certificate.Type)) + '：' + Util.Read.simpleReplace(obj)} />
                                                :
                                                from === 'flight'?
                                                <CustomText  text={I18nUtil.translate(Util.Read.typeTocertificate2(item.Certificate && item.Certificate.Type)) +'：' + Util.Read.simpleReplace(item.Certificate && item.Certificate.SerialNumber)} />
                                                :
                                                <CustomText  text={I18nUtil.translate(Util.Read.typeTocertificate(item.Certificate && item.Certificate.Type)) +'：' + Util.Read.simpleReplace(item.Certificate && item.Certificate.SerialNumber)} />
                                        }
                                        {feeType === 1 && ApproveList ? <View>
                                            {compSwitch ? null :
                                                !isHideAttribute ? <View style={styles.itemRow}>
                                                    <CustomText text='费用归属' style={{ color: 'gray' }} />
                                                    <CustomText text=': ' style={{ color: 'gray' }} />
                                                    <CustomText style={{width:140 }} text={Approver && (Approver.ApproveOrigin && Approver.ApproveOrigin.OriginType === 2 ? (Approver.ShortDepartmentName) : (Approver.ProjectName))} />
                                                </View> : null
                                            }
                                            {(from === 'hotel' && PaymenType === 1)||compSwitch ? null :
                                                <View>
                                                    {
                                                        Approver && Approver.ApproveList.length > 0 ?
                                                            <View style={styles.itemRow}>
                                                                <CustomText text='审批级别' style={{ color: 'gray' }} />
                                                                {
                                                                    Util.Parse.isChinese() ? <CustomText text={Approver && Approver.ApproveLevel > 0 ? ('：' + Approver.ApproveLevel + '级') : ('：' + I18nUtil.translate('免审'))} /> :
                                                                        <CustomText text={Approver && Approver.ApproveLevel > 0 ? ('：' + 'level' + '-' + Approver.ApproveLevel + ' of Approval') : ('：' + I18nUtil.translate('免审'))} />
                                                                }
                                                            </View> : null
                                                    }
                                                    {
                                                     
                                                            <View style={styles.itemRow}>
                                                                <CustomText text='审批人' style={{ color: 'gray' }} />
                                                                <CustomText text={'：'} />
                                                                <View style={{width:185}}>
                                                                <CustomText text={approPeople} style={{width:140}}/>
                                                                </View>
                                                                
                                                            </View>
                                                    }

                                                </View>
                                            }
                                        </View>
                                            : null
                                        }
                                        {   fromNo&&fromNo===32||8?null:
                                            item.AdditionInfo && item.AdditionInfo.DictItemList && item.AdditionInfo.DictItemList.map((item) => {
                                                return (
                                                    <View >
                                                        {
                                                            <View style={styles.itemRow}>
                                                                <CustomText text={Util.Parse.isChinese() ? item.DictName : item.DictEnName ? item.DictEnName : item.DictName} style={{ color: 'gray' }} />
                                                                <CustomText text={' '} />
                                                                {
                                                                    //    Util.Parse.isChinese()?
                                                                    item.ItemName ? <CustomText text={Util.Parse.isChinese() ? item.ItemName : (item.ItemEnName ? item.ItemEnName : item.ItemName)} /> :null
                                                                    //    :
                                                                    //    item.ItemEnName&&<CustomText text={item.ItemEnName} />
                                                                }
                                                            </View>
                                                        }
                                                    </View>
                                                )
                                            })
                                        }
                                    </View>
                                </View>
                            )
                        })
                        : null
                }
            </View >
        )
    }
}
const getStateProps = state => ({
    compSwitch: state.compSwitch.bool
})
export default connect(getStateProps)(PassengerSureView);

const styles = StyleSheet.create({
    header: {
        height: 50,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        flexDirection: 'row',
        backgroundColor: 'white'
    },
    row: {
        flexDirection: 'column',
        // alignItems: 'center',
        marginHorizontal: 20,
        // height:44,
        borderBottomColor: Theme.lineColor,
        paddingVertical: 5,
    },
    itemRow: {
        flexDirection: 'row', 
        alignItems: 'flex-start',
        marginVertical: 5
    }
})