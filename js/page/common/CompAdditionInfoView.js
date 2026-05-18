import React from 'react';

import {
    View,
    StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';
import UserInfoUtil from '../../util/UserInfoUtil';
import CustomText from '../../custom/CustomText';
import CustomeTextInput from '../../custom/CustomTextInput';
import Customer from '../../res/styles/Customer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Theme from '../../res/styles/Theme';
// import { withNavigation } from 'react-navigation';
import { useNavigation } from '@react-navigation/native';
import NavigationUtils from '../../navigator/NavigationUtils';
import HighLight from '../../custom/HighLight';
import Util from '../../util/Util';
import { InfoDicView }  from '../../custom/HighLight';
import CheckBox from '../../custom/CheckBox';

let itemIndex;
class CompAdditionInfoView extends React.Component {
    constructor(props) {
        super(props);
        this.state={
            item_index:{},
            selectedNeed:true,//是否需要输入审批人
        }
    }
    static propTypes = {
        AdditionIfo: PropTypes.object.isRequired,
        customerInfo: PropTypes.object.isRequired,
    }

    _getWorkDicList = () => {
        const { DicList1, customerInfo } = this.props;
        if (Array.isArray(DicList1) && DicList1.length > 0) return DicList1;
        if (customerInfo && Array.isArray(customerInfo.DictList)) return customerInfo.DictList;
        return [];
    }

    _getConfigId = (obj) => {
        if (!obj) return undefined;
        return obj.Id !== undefined && obj.Id !== null ? obj.Id : obj.DictId;
    }

    _findDictItem = (dictItemList, cfg) => {
        if (!Array.isArray(dictItemList) || !cfg) return undefined;
        const cfgId = this._getConfigId(cfg);
        const cfgCode = cfg.Code !== undefined && cfg.Code !== null ? cfg.Code : cfg.DictCode;
        return dictItemList.find(item => {
            if (!item) return false;
            if (cfgCode !== undefined && cfgCode !== null && item.DictCode == cfgCode) return true;
            return cfgId !== undefined && item.DictId == cfgId;
        });
    }

    _getParentValue = (workDicList, obj, dictItemList) => {
        const cfgId = this._getConfigId(obj);
        if (!cfgId || !Array.isArray(workDicList)) return undefined;
        const parentCfg = workDicList.find(i => i && i.NextId == cfgId);
        if (!parentCfg) return undefined;
        const parentItem = this._findDictItem(dictItemList, parentCfg);
        return parentItem && parentItem.ItemName;
    }

    _isVisible = (workDicList, obj, dictMapList, dictItemList) => {
        if (!obj) return false;
        if (obj.showNext !== undefined && obj.showNext !== null) {
            return !!obj.showNext;
        }
        const cfgId = this._getConfigId(obj);
        if (!cfgId) return true;
        const selfItem = this._findDictItem(dictItemList, obj);
        if (selfItem && (selfItem.ItemName || selfItem.ItemId || selfItem.ItemInput)) return true;
        if (!Array.isArray(workDicList) || workDicList.length === 0) return true;
        const hasParent = workDicList.some(i => i && i.NextId == cfgId);
        if (!hasParent) return true;
        const parentName = this._getParentValue(workDicList, obj, dictItemList);
        if (!parentName) return false;
        const rules = (Array.isArray(dictMapList) ? dictMapList : []).filter(m => m && m.DictId == cfgId);
        if (!rules || rules.length === 0) return true;
        return rules.some(m => m && m.ParentName == parentName);
    }

    _valueCHange = (text, obj) => {
        // obj.ItemName = text;
        // obj.ItemEnName = text;
        if(!obj){return}
        const { AdditionIfo } = this.props;
        itemIndex = AdditionIfo&&AdditionIfo.DictItemList&&AdditionIfo.DictItemList.find(item => item.DictId === obj.Id);
        if (itemIndex) {
            itemIndex.ItemName = text;
            itemIndex.ItemInput = text;
            itemIndex.ItemEnName = text;
            itemIndex.Id = obj.Id;
            itemIndex.DictCode = obj.Code
            itemIndex.NeedInput = obj.NeedInput
        } else {
            let model = {
                DictId: obj.Id,
                Id: obj.Id,
                DictName: obj.Name,
                DictEnName: obj.EnName,
                ItemId: '',
                ItemSerialNumber: '',
                ItemName: text,
                ItemEnName: text,
                FormatRegexp: obj.FormatRegexp,
                Remark: obj.Remark,
                EnName: obj.EnName,
                RemarkNo: obj.RemarkNo,
                ItemInput: text,
                DictCode: obj.Code,
                NeedInput:obj.NeedInput,
        }
            AdditionIfo&&AdditionIfo.DictItemList.push(model);
        }
        this.setState({});
    }

    _clearCascadeByNextId = (nextId) => {
        if (!nextId) return;
        const { AdditionIfo } = this.props;
        const workDicList = this._getWorkDicList();
        let curId = nextId;
        while (curId) {
            if (AdditionIfo && Array.isArray(AdditionIfo.DictItemList) && AdditionIfo.DictItemList.length > 0) {
                for (let i = AdditionIfo.DictItemList.length - 1; i >= 0; i--) {
                    const it = AdditionIfo.DictItemList[i];
                    if (it && it.DictId == curId) {
                        AdditionIfo.DictItemList.splice(i, 1);
                    }
                }
            }
            const cfg = Array.isArray(workDicList) ? workDicList.find(i => i && this._getConfigId(i) == curId) : undefined;
            curId = cfg && cfg.NextId;
        }
    }

    _clearSelectedDic = (obj) => {
        if (!obj) return;
        const { AdditionIfo } = this.props;
        const cfgId = this._getConfigId(obj);
        if (obj.NextId) {
            this._clearCascadeByNextId(obj.NextId);
        }
        if (AdditionIfo && Array.isArray(AdditionIfo.DictItemList) && AdditionIfo.DictItemList.length > 0) {
            for (let i = AdditionIfo.DictItemList.length - 1; i >= 0; i--) {
                const it = AdditionIfo.DictItemList[i];
                if (!it) continue;
                if ((obj.Code !== undefined && obj.Code !== null && it.DictCode == obj.Code) || it.DictId == cfgId) {
                    AdditionIfo.DictItemList.splice(i, 1);
                    break;
                }
            }
        }
        this.setState({});
    }
    _toSelectDicList = (obj) => {
        if (!obj) return;
        const { AdditionIfo, customerInfo } = this.props;
        const workDicList = this._getWorkDicList();
        const dictMapList = customerInfo && customerInfo.DictMapList;
        const dictItemList = AdditionIfo && AdditionIfo.DictItemList;
        const cfgId = this._getConfigId(obj);
        const cfgName = obj.Name !== undefined && obj.Name !== null ? obj.Name : obj.DictName;
        const cfgEnName = obj.EnName !== undefined && obj.EnName !== null ? obj.EnName : obj.DictEnName;
        const parentValue = obj.BeforeParentName !== undefined && obj.BeforeParentName !== null
            ? obj.BeforeParentName
            : (obj.parentValue !== undefined && obj.parentValue !== null ? obj.parentValue : this._getParentValue(workDicList, obj, dictItemList));
        const dic = this._findDictItem(dictItemList, obj);
        const prevSelectName = dic ? dic.ItemName : undefined;

        NavigationUtils.push(this.props.navigation, 'DicList', {
            title: Util.Parse.isChinese() ? cfgName : (cfgEnName || cfgName),
            Id: cfgId,
            ParentValue: parentValue,
            callBack: (data) => {
                const isChanged = prevSelectName !== undefined && prevSelectName !== data.Name;
                if (isChanged && obj.NextId) {
                    this._clearCascadeByNextId(obj.NextId);
                }

                const cfgCode = obj.Code !== undefined && obj.Code !== null ? obj.Code : obj.DictCode;
                const cfgDictName = cfgName;
                const cfgDictEnName = cfgEnName;

                const exist = this._findDictItem(dictItemList, obj);
                if (exist) {
                    exist.DictId = cfgId;
                    exist.Id = cfgId;
                    exist.DictName = cfgDictName;
                    exist.DictEnName = cfgDictEnName;
                    exist.ItemId = data.Id;
                    exist.ItemSerialNumber = data.SerialNumber;
                    exist.ItemName = data.Name;
                    exist.ItemEnName = data.EnName;
                    exist.ItemInput = data.Name;
                    exist.DictCode = cfgCode;
                    exist.NeedInput = obj.NeedInput;
                } else {
                    const model = {
                        DictId: cfgId,
                        Id: cfgId,
                        DictName: cfgDictName,
                        DictEnName: cfgDictEnName,
                        ItemId: data.Id,
                        ItemSerialNumber: data.SerialNumber,
                        ItemName: data.Name,
                        ItemEnName: data.EnName,
                        ItemInput: data.Name,
                        DictCode: cfgCode,
                        NeedInput: obj.NeedInput,
                        RemarkNo: obj.RemarkNo,
                    };
                    AdditionIfo && AdditionIfo.DictItemList && AdditionIfo.DictItemList.push(model);
                }
                this.setState({});
            }
        })
    }

    render() {
        const {fromNo,customerInfo,AdditionIfo,DicList1,PdfDictList,NoApproval,haveHotel} = this.props;
        const workDicList = this._getWorkDicList();
        const dictMapList = customerInfo && customerInfo.DictMapList;
        const dictItemList = AdditionIfo && AdditionIfo.DictItemList;
        const shownCache = new Map();
        const visiting = new Set();
        const isCfgShown = (cfg) => {
            if (!cfg) return false;
            const cfgId = this._getConfigId(cfg);
            if (!cfgId) return false;
            if (shownCache.has(cfgId)) return shownCache.get(cfgId);
            if (visiting.has(cfgId)) return false;
            visiting.add(cfgId);
            const showNext = this._isVisible(workDicList, cfg, dictMapList, dictItemList);
            let shown = false;
            if (showNext && (cfg.BusinessCategory & fromNo)) {
                const parentCfg = Array.isArray(workDicList) ? workDicList.find(i => i && i.NextId == cfgId) : undefined;
                if (!parentCfg) {
                    shown = !!cfg.ShowInOrder;
                } else {
                    shown = isCfgShown(parentCfg);
                }
            }
            visiting.delete(cfgId);
            shownCache.set(cfgId, shown);
            return shown;
        };
        //找到AdditionIfo.DictItemList中和PdfDictList中名称相同的对象，并将PdfDictList中对象的属性值赋给AdditionIfo.DictItemList中对象        
        if(PdfDictList&&PdfDictList.length>0){
            PdfDictList.forEach((pdfItem,index)=>{
                AdditionIfo.DictItemList.forEach((item,index)=>{
                    if(item.DictName == pdfItem.DictName){
                        item.ItemInput = pdfItem.Value
                        item.ItemName = pdfItem.Value
                        item.ItemEnName = pdfItem.Value
                    }
                })
            })
        }
        return (
            <View style={styles.view}>
               { DicList1&&DicList1.length>0 ?null:
                customerInfo.DictList&&customerInfo.DictList.map((obj, index)=>{
                        const showNext = this._isVisible(workDicList, obj, dictMapList, dictItemList);
                        const showItem = isCfgShown(obj);
                        let itemIndex =AdditionIfo&&AdditionIfo.DictItemList&&AdditionIfo.DictItemList.find(item => 
                            item.DictCode === obj.Code
                        );
                            if(obj.NeedInput&&itemIndex ){
                                // itemIndex.Id = obj.Id
                                // itemIndex.DictId = obj.Id
                                // itemIndex.DictName = obj.Name
                                // itemIndex.DictEnName = obj.EnName
                                // itemIndex.Sort = obj.Sort
                                // itemIndex.Remark = obj.Remark
                                // itemIndex.EnRemark = obj.EnRemark
                                // itemIndex.ShowInOrder = obj.ShowInOrder
                                // itemIndex.ItemName = obj.ItemName
                                // itemIndex.DictCode = obj.Code
                                // itemIndex.NeedInput = obj.NeedInput
                                 itemIndex.IsShowWhenMissingHotelUnitInMassOrder = obj.IsShowWhenMissingHotelUnitInMassOrder
                           }
                       return (
                        showItem ? //判断指定业务
                            (
                                customerInfo.CustomerHandleName==="Ontheway.TMC.CustomerHandlers.Shell.ShellHandler"&& obj.Name==="approver's email address")?
                                !NoApproval?
                                <View key={index} style={{}}>
                                    <View style={{flexDirection:'row',height:25,marginTop:10}}>
                                        <CustomText text={"本次行程需要审批"} style={{ flex: 3,fontSize:14,color:Theme.commonFontColor }} />
                                        <CheckBox
                                            isChecked={this.state.selectedNeed}
                                            onClick={() =>{ 
                                                this.setState({ 
                                                    selectedNeed: !this.state.selectedNeed,
                                                },()=>{
                                                    customerInfo.selectedNeed = this.state.selectedNeed
                                                })
                                               }
                                            }
                                        />
                                    </View>
                                    {
                                        this.state.selectedNeed ?
                                            <CustomeTextInput value={itemIndex && itemIndex.ItemName} 
                                                            style={{height:40}} 
                                                            placeholder={"请填写审批人邮箱"} 
                                                            onChangeText={(text) => {
                                                                    this._valueCHange(text, obj);
                                                            }} />
                                        :null
                                    }
                                    <View style={{height:1,backgroundColor:Theme.lineColor}} />
                                    {this.state.selectedNeed ? <CustomText text={Util.Parse.isChinese() ? obj.Remark : obj.EnRemark ? obj.EnRemark:obj.Remark} style={{ fontSize:12,color:Theme.assistFontColor,marginBottom:10,marginLeft:5 }} />:null}
                                </View>
                                :null
                            :
                            <InfoDicView index={index}
                                            obj={obj} 
                                            itemIndex={itemIndex} 
                                            value_Change={(text)=>{
                                                this._valueCHange(text, obj);
                                            }}
                                            select_DicList={()=>{
                                                this._toSelectDicList(obj)
                                            }}
                                            clear_DicList={()=>{
                                                this._clearSelectedDic(obj)
                                            }}
                                            haveHotel={haveHotel}
                            />
                            
                        :null
                    )
                })
               }
               {
                    DicList1 && DicList1.length > 0 ?//申请单
                        DicList1.map((obj, index) => {
                            const showNext = this._isVisible(workDicList, obj, dictMapList, dictItemList);
                            const showItem = isCfgShown(obj);
                            let itemIndex =AdditionIfo&&AdditionIfo.DictItemList&&AdditionIfo.DictItemList.find(
                                item => item.DictCode == obj.DictCode
                            );
                            return (
                                showItem?
                                    <InfoDicView index={index} 
                                                    obj={obj} 
                                                    itemIndex={itemIndex} 
                                                    value_Change={(text)=>{
                                                        this._valueCHange(text, obj);
                                                    }}
                                                    select_DicList={()=>{
                                                        this._toSelectDicList(obj)
                                                    }}
                                                    clear_DicList={()=>{
                                                        this._clearSelectedDic(obj)
                                                    }}
                                                    editable={true}
                                    />
                                    // <View key={index} style={styles.row}>
                                    //     {obj.IsRequire?<HighLight name={obj.DictName&&obj.DictName} value={itemIndex}/>:<CustomText text={obj.DictName} style={{ flex: 3 }} />}
                                    //     {
                                    //         obj.NeedInput ?
                                    //             <CustomeTextInput style={{ flex: 7, backgroundColor:obj.IsRequire&& !itemIndex.ItemName ?'#F7CCD1': '#fff', height: 40}} value={itemIndex && itemIndex.ItemName} 
                                    //                             placeholder={obj.Remark}  onChangeText={(text) => {
                                    //                 this._valueCHange(text, obj);
                                    //             }} />
                                    //             :
                                    //             <View style={styles.rowRight}>
                                    //                 <CustomText text={itemIndex ? itemIndex.ItemName : obj.Remark} style={{ color: itemIndex ? '#333' : 'gray', flex: 1 }} onPress={this._toSelectDicList.bind(this, itemIndex)} />
                                    //                 <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} />
                                    //             </View>
                                    //     }
                                    // </View>
                                :null                                
                            )
                        })
                    : null
                }
             </View>
        )
    }
}
export default function(props) {
    const navigation = useNavigation();
    return (
        <CompAdditionInfoView {...props} navigation={navigation} />
     )
}
const styles = StyleSheet.create({
    view: {
        backgroundColor: 'white',
        paddingHorizontal:20,
    },
    row: {
        height: 44,
        marginHorizontal: 20,
        flex: 1,
        borderBottomColor: Theme.themeLine,
        borderBottomWidth: 1
    },
    rowRight: {
        flex: 7,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    }
})