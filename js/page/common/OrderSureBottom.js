
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Theme from '../../res/styles/Theme';
import CustomText from './../../custom/CustomText';
import I18nUtil from '../../util/I18nUtil';
import PropTypes from 'prop-types';
import UserInfoUtil from '../../util/UserInfoUtil';
// import { withNavigation } from 'react-navigation';
import { useNavigation } from '@react-navigation/native';
import NavigationUtils from '../../navigator/NavigationUtils';
import Util from '../../util/Util';
class OrderSureBottom extends React.PureComponent {

    static propTypes = {
        AdditionInfo: PropTypes.object.isRequired,
        customerInfo: PropTypes.object.isRequired,
        from: PropTypes.string.isRequired
    }
    _toWebDelegate = (item) => {
        NavigationUtils.push(this.props.navigation, 'Web', {
            url: item.Url,
            title: item.Name
        });
    }

    _renderAdditionInfo = () => {
        const { AdditionInfo, customerInfo, from } = this.props;
        if (!AdditionInfo) return null;
        const additionArr = UserInfoUtil.Addition(customerInfo);
        const dictConfigList = (customerInfo && customerInfo.DictList) ? customerInfo.DictList : [];
        const dictMapList = (customerInfo && customerInfo.DictMapList) ? customerInfo.DictMapList : [];
        const employeeDictList = (customerInfo && customerInfo.EmployeeDictList) ? customerInfo.EmployeeDictList : [];
        const dictItemList = Array.isArray(AdditionInfo.DictItemList) ? AdditionInfo.DictItemList : [];
        const dicList = [];
        const fromNo = this.props.fromNo !== undefined && this.props.fromNo !== null
            ? this.props.fromNo
            : (from === 'flight' ? 2 : (from === 'intlFlight' ? 32 : (from === 'train' ? 8 : null)));

        additionArr.forEach((cfg) => {
            if (!cfg || !cfg.en) return;
            const v = AdditionInfo[cfg.en];
            if (!v) return;
            dicList.push({
                name: cfg.name,
                value: v,
                EnName: cfg.EnName,
            });
        });

        const getVisibleConfigs = function (allConfigs, employeeConfigs, mapList, itemList) {
            var configs = allConfigs || [];
            var employees = employeeConfigs || [];
            var rulesList = mapList || [];
            var items = itemList || [];

            var employeeIdSet = new Set();
            employees.forEach(function (e) {
                if (e && e.Id !== undefined) employeeIdSet.add(e.Id);
            });

            var diffConfigs = (fromNo === 128)
                ? configs
                : configs.filter(function (cfg) { return cfg && cfg.Id !== undefined && !employeeIdSet.has(cfg.Id); });

            var workConfigs = diffConfigs.filter(function (cfg) {
                if (!cfg || cfg.Id === undefined) return false;
                if (!fromNo) return true;
                return (cfg.BusinessCategory & fromNo);
            });

            var byId = {};
            var nextIdArr = [];
            workConfigs.forEach(function (cfg) {
                if (!cfg || cfg.Id === undefined) return;
                byId[cfg.Id] = cfg;
                if (cfg.NextId) nextIdArr.push(cfg.NextId);
            });

            var showNextById = {};
            var explicitShowNextById = {};
            workConfigs.forEach(function (cfg) {
                if (!cfg || cfg.Id === undefined) return;
                explicitShowNextById[cfg.Id] = !(cfg.showNext === undefined || cfg.showNext === null);
                showNextById[cfg.Id] = explicitShowNextById[cfg.Id]
                    ? cfg.showNext
                    : (nextIdArr.indexOf(cfg.Id) === -1);
            });

            var cascadeChildIdSet = new Set();
            workConfigs.forEach(function (cfg) {
                if (!cfg || cfg.Id === undefined) return;
                if (cfg.BeforeParentNameList && cfg.BeforeParentNameList.length > 0) {
                    cascadeChildIdSet.add(cfg.Id);
                }
            });

            var findDicItem = function (cfg) {
                if (!cfg) return null;
                return items.find(function (it) {
                    if (!it) return false;
                    if (cfg.Code !== undefined && it.DictCode == cfg.Code) return true;
                    return it.DictId == cfg.Id;
                }) || null;
            };

            var progressed = true;
            while (progressed) {
                progressed = false;
                workConfigs.forEach(function (parentCfg) {
                    if (!parentCfg || parentCfg.Id === undefined || !parentCfg.NextId) return;
                    if (showNextById[parentCfg.Id] !== true) return;
                    var parentIsCascadeChild = cascadeChildIdSet.has(parentCfg.Id) || (parentCfg.BeforeParentNameList && parentCfg.BeforeParentNameList.length > 0);
                    if (!parentCfg.ShowInOrder && !parentIsCascadeChild) return;
                    var parentItem = findDicItem(parentCfg);
                    var parentName = parentItem && parentItem.ItemName;
                    if (!parentName) return;
                    var nextId = parentCfg.NextId;
                    var childCfg = byId[nextId];
                    if (!childCfg) return;
                    var rules = rulesList.filter(function (m) { return m && m.DictId == nextId; });
                    if (!rules || rules.length === 0) return;
                    if (!rules.some(function (m) { return m && m.ParentName == parentName; })) return;
                    if (!explicitShowNextById[nextId] && showNextById[nextId] !== true) {
                        showNextById[nextId] = true;
                        progressed = true;
                    }
                    if (!cascadeChildIdSet.has(nextId)) {
                        cascadeChildIdSet.add(nextId);
                        progressed = true;
                    }
                });
            }

            return { workConfigs: workConfigs, showNextById: showNextById, cascadeChildIdSet: cascadeChildIdSet };
        };

        const { workConfigs, showNextById, cascadeChildIdSet } = getVisibleConfigs(dictConfigList, employeeDictList, dictMapList, dictItemList);
        workConfigs.forEach((cfg) => {
            if (!cfg || cfg.Id === undefined) return;
            if (showNextById[cfg.Id] !== true) return;
            const isCascadeChild = cascadeChildIdSet.has(cfg.Id) || (cfg.BeforeParentNameList && cfg.BeforeParentNameList.length > 0);
            if (!cfg.ShowInOrder && !isCascadeChild) return;

            const dicItem = dictItemList.find((it) => {
                if (!it) return false;
                if (cfg.Code !== undefined && it.DictCode == cfg.Code) return true;
                return it.DictId == cfg.Id;
            });
            const value = dicItem
                ? (Util.Parse.isChinese()
                    ? (dicItem.ItemName || '')
                    : (dicItem.ItemEnName || dicItem.ItemName || ''))
                : '';
            dicList.push({
                name: Util.Parse.isChinese() ? cfg.Name : (cfg.EnName || cfg.Name),
                value,
            });
        });

        if (dicList.length === 0) return null;
        return (
            <View style={{ marginHorizontal: 10,borderRadius:6,backgroundColor:'#fff',marginTop:10 }}>
                {
                    dicList.map((item, index) => {
                        return (
                            <View key={index} style={styles.dicRow}>
                                 <CustomText text={item.name} />
                                <CustomText text={item.value}  style={{flex:1,textAlign:'right',marginLeft:10}}/> 
                            </View>
                        )
                    })
                }
            </View>
        )
    }
    render() {
        const { from ,customerInfo,TermsAgreement} = this.props;
        return (
            <View style={{ }}>
                {this._renderAdditionInfo()}
                {(TermsAgreement&&TermsAgreement.length>0)? 
                    <View style={styles.row}>
                        <Image style={{height:16,width:16}} source={require('../../res/Uimage/check.png')}  ></Image>
                        <View style={{ flexDirection: 'row',marginLeft:5,paddingRight:5}}>
                            <Text style={{ fontSize: 12, color: '#666666' }}>
                                {I18nUtil.translate('点击提交订单表示您已阅读并同意')}
                                {
                                    TermsAgreement&&TermsAgreement.map((item)=>{
                                        return(
                                            <Text style={{ color: Theme.theme }} onPress={()=>{this._toWebDelegate(item)}}>{I18nUtil.translate(item.Name)}</Text>
                                        )
                                    })
                                }
                                {I18nUtil.translate('以上条款')}                          
                            </Text>
                        </View>
                    </View>
                  :null
                }
                {from !== 'hotel' ? <View style={styles.row}>
                    <Image style={{height:16,width:16}} source={require('../../res/Uimage/check.png')}  ></Image>
                    <CustomText style={styles.text} text={`${from === 'flight' || from === 'intlFlight' ? '乘机人' : '乘车人'}、证件号码为关键信息,如因错误信息发生后续费用将由您自行承担`} />
                </View> : null}
                {(from === 'flight' || from === 'intlFlight') ? 
                    <View>
                        {
                            // from === 'flight'?
                                <View style={styles.row}>
                                    <Image style={{height:16,width:16}} source={require('../../res/Uimage/check.png')}  ></Image>
                                    {
                                    Util.Parse.isChinese()?
                                    <Text style={styles.text}>{'因任何原因需要进行的退改签机票（包含因客观原因导致的航班取消），须自行通过订票系统或拨打'+(customerInfo&&customerInfo.Setting && customerInfo.Setting.ServiceTel?customerInfo.Setting.ServiceTel:'')+'进行退改签操作处理' }</Text>
                                    :
                                    <Text style={styles.text}>{I18nUtil.tranlateInsert('因任何原因需要进行的退改签机票（包含因客观原因导致的航班取消），须自行通过订票系统或拨打{{noun}}进行退改签操作处理', customerInfo&&customerInfo.Setting && customerInfo.Setting.ServiceTel?customerInfo.Setting.ServiceTel:'')}</Text>
                                    }
                                </View>
                            // :null
                        }
                        <View style={styles.row}>
                            <Image style={{height:16,width:16}} source={require('../../res/Uimage/check.png')}  ></Image>
                        {
                            Util.Parse.isChinese()?
                            <Text style={styles.text}>{'旅客个人中心所维护的偏好等信息会在预定时被用来向航司申请,但由于航班或者航司等原因申请可能会不成功. 部分航司不支持在线申请. 最终的偏好申请结果以航司值机时的确认为准,如您需要线下协助,请致电您的差旅顾问.'}</Text>
                            :
                            <Text style={styles.text}>{'Travel preferences from your profile will be submitted to the airline but are subject to availability. Final confirmation will be made at check-in. For assistance, please contact your travel consultant.'}</Text>
                        }
                        </View> 
                    </View>
                : null}
            </View>
        )
    }
}
// export default withNavigation(OrderSureBottom);
export default function(props) {
    const navigation = useNavigation();
    return <OrderSureBottom {...props} navigation={navigation} />
}
const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        marginTop: 10,
        marginLeft: 10,
        paddingLeft:2,
        paddingRight:20
    },
    text: {
        fontSize: 12,
        // marginRight: 10,
        marginLeft: 5,
        color: '#666666'
    },
    dicRow: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        paddingHorizontal:20,
        padding:10,
    }
})
