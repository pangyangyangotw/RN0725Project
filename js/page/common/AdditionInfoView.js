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
import { connect } from 'react-redux';
import NavigationUtils from '../../navigator/NavigationUtils';
import {InfoDicView} from '../../custom/HighLight';
import Util from '../../util/Util';
let itemIndex;
class AdditionInfoView extends React.Component {
    constructor(props) {
        super(props);
        this._cascadeSeedSig = null;
        this.state = {
            item_index: {},
            ...this._calcDiffState(props),
        };
    }
    static propTypes = {
        AdditionIfo: PropTypes.object.isRequired,
        customerInfo: PropTypes.object.isRequired,
        userInfo: PropTypes.object.isRequired,
        ApproveOrigin: PropTypes.object.isRequired,
        DicList: PropTypes.array
    }

    _calcDiffState = (props) => {
        const { customerInfo, fromNo } = props || {};
        if (!customerInfo || !customerInfo.Setting) {
            return { diffArr: [], diffDicList: [] };
        }

        const customerDicList = customerInfo.DictList || [];
        const employeeDictList = customerInfo.EmployeeDictList || [];

        const dicListArr = customerDicList.map(item => item.Id);
        const employeeArr = employeeDictList.map(item => item.Id);
        console.log('dicListArr', customerDicList);
        let diffArr;
        if (fromNo === 128) {
            diffArr = dicListArr;
        } else {
            diffArr = dicListArr.filter(val => employeeArr.indexOf(val) === -1);
        }

        const nextIdArr = [];
        const diffDicList = [];
        customerDicList.forEach(item => {
            if (diffArr.indexOf(item.Id) !== -1) {
                if (item.NextId) nextIdArr.push(item.NextId);
                item.showNext = true;
                item.BeforeParentNameList = [];
                diffDicList.push(item);
            }
        });

        diffDicList.forEach(item => {
            if (nextIdArr.indexOf(item.Id) !== -1) {
                item.showNext = false;
            }
        });

        return { diffArr, diffDicList };
    }

    componentDidMount() {
        this._syncCascadeFromAdditionInfo();
    }

    componentDidUpdate(prevProps) {
        const prevCustomer = prevProps && prevProps.customerInfo;
        const nextCustomer = this.props && this.props.customerInfo;
        const fromNoChanged = prevProps && prevProps.fromNo !== this.props.fromNo;

        if (prevCustomer !== nextCustomer || fromNoChanged) {
            const nextState = this._calcDiffState(this.props);
            this._cascadeSeedSig = null;
            this.setState(nextState, () => {
                this._syncCascadeFromAdditionInfo();
            });
            return;
        }

        const prevDicList = prevProps && prevProps.DicList;
        const nextDicList = this.props && this.props.DicList;
        const dicListChanged = prevDicList !== nextDicList;
        const additionChanged = prevProps && prevProps.AdditionIfo !== this.props.AdditionIfo;
        if (dicListChanged || additionChanged) {
            this._cascadeSeedSig = null;
            this._syncCascadeFromAdditionInfo();
        }
    }

    _syncCascadeFromAdditionInfo = () => {
        const { AdditionIfo, customerInfo } = this.props;
        const { diffDicList } = this.state;
        const DicList = this.props.DicList;
        const workDicList = (DicList && DicList.length > 0) ? DicList : diffDicList;
        if (!workDicList || workDicList.length === 0) return;
        if (!AdditionIfo || !Array.isArray(AdditionIfo.DictItemList)) return;

        const dictItems = AdditionIfo.DictItemList;
        const seedSig = [
            (customerInfo && customerInfo.Customer && customerInfo.Customer.Id) || '',
            (this.props && this.props.fromNo) || '',
            (workDicList && workDicList.length) || 0,
            dictItems.map(it => `${it && (it.DictId || it.DictCode) || ''}:${it && it.ItemName || ''}`).join('|')
        ].join('::');
        if (this._cascadeSeedSig === seedSig) return;
        this._cascadeSeedSig = seedSig;

        const dictMapList = (customerInfo && customerInfo.DictMapList) ? customerInfo.DictMapList : [];

        const nextIdArr = [];
        workDicList.forEach(i => {
            if (i && i.NextId) nextIdArr.push(i.NextId);
        });
        if (DicList && DicList.length > 0) {
            workDicList.forEach(obj => {
                if (!obj) return;
                obj.showNext = (nextIdArr.indexOf(obj.Id) === -1);
                obj.BeforeParentName = undefined;
                obj.BeforeParentNameList = [];
            });
        } else {
            workDicList.forEach(obj => {
                if (!obj) return;
                obj.showNext = true;
                obj.BeforeParentName = undefined;
                obj.BeforeParentNameList = [];
            });
            workDicList.forEach(obj => {
                if (!obj) return;
                if (nextIdArr.indexOf(obj.Id) !== -1) {
                    obj.showNext = false;
                }
            });
        }

        const findDicItem = (obj) => {
            if (!obj) return null;
            return dictItems.find(item =>
                (obj.Code !== undefined && item && item.DictCode == obj.Code) || (item && item.DictId === obj.Id)
            ) || null;
        };

        let changed = false;
        let progressed = true;
        while (progressed) {
            progressed = false;
            workDicList.forEach(parentObj => {
                if (!parentObj || !parentObj.NextId) return;
                if (parentObj.showNext !== true) return;
                if (!DicList || DicList.length === 0) {
                    const fromNo = this.props && this.props.fromNo;
                    if (!(parentObj.BusinessCategory & fromNo)) return;
                    const isCascadeChild = parentObj.BeforeParentNameList && parentObj.BeforeParentNameList.length > 0;
                    if (!(parentObj.ShowInOrder || isCascadeChild)) return;
                }
                const parentDic = findDicItem(parentObj);
                const parentName = parentDic && parentDic.ItemName;
                if (!parentName) return;
                const nextId = parentObj.NextId;
                const rules = dictMapList.filter(m => m && m.DictId == nextId);
                if (!rules || rules.length === 0) return;
                if (!rules.some(m => m && m.ParentName == parentName)) return;
                const childObj = workDicList.find(d => d && d.Id == nextId);
                if (!childObj) return;
                if (childObj.showNext !== true) {
                    childObj.showNext = true;
                    progressed = true;
                    changed = true;
                }
                if (childObj.BeforeParentName !== parentName) {
                    childObj.BeforeParentName = parentName;
                    childObj.BeforeParentNameList = [parentName];
                    changed = true;
                }
            });
        }

        if (changed) {
            this.setState({});
        }
    }

    _clearCascadeByNextId = (nextId) => {
        if (!nextId) return;
        const { AdditionIfo } = this.props;
        const { diffDicList } = this.state;
        const workDicList = (this.props.DicList && this.props.DicList.length > 0) ? this.props.DicList : diffDicList;

        let curId = nextId;
        while (curId) {
            if (AdditionIfo && AdditionIfo.DictItemList && AdditionIfo.DictItemList.length > 0) {
                for (let i = AdditionIfo.DictItemList.length - 1; i >= 0; i--) {
                    if (AdditionIfo.DictItemList[i] && AdditionIfo.DictItemList[i].DictId == curId) {
                        AdditionIfo.DictItemList.splice(i, 1);
                    }
                }
            }

            const curObj = workDicList && workDicList.find(item => item && item.Id == curId);
            if (curObj) {
                curObj.showNext = false;
                curObj.BeforeParentName = undefined;
                curObj.BeforeParentNameList = [];
                curId = curObj.NextId;
            } else {
                curId = undefined;
            }
        }
    }

    _clearSelectedDic = (obj) => {
        if (!obj) return;
        const { AdditionIfo } = this.props;
        if (obj.NextId) {
            this._clearCascadeByNextId(obj.NextId);
        }
        if (AdditionIfo && Array.isArray(AdditionIfo.DictItemList) && AdditionIfo.DictItemList.length > 0) {
            for (let i = AdditionIfo.DictItemList.length - 1; i >= 0; i--) {
                const it = AdditionIfo.DictItemList[i];
                if (!it) continue;
                if ((obj.Code !== undefined && it.DictCode == obj.Code) || it.DictId == obj.Id) {
                    AdditionIfo.DictItemList.splice(i, 1);
                    break;
                }
            }
        }
        this.setState({});
    }

    _valueCHange = (text, obj) => {
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
                NeedInput:obj.NeedInput
        }
            AdditionIfo&&AdditionIfo.DictItemList.push(model);
        }
        this.setState({});
    }
    _toSelectDicList = (obj) => {
        if(!obj){return}
        const { AdditionIfo, customerInfo } = this.props;
        const { diffDicList } = this.state;
        const workDicList = (this.props.DicList && this.props.DicList.length > 0) ? this.props.DicList : diffDicList;
        let DictMapList = customerInfo?.DictMapList||[];
        //过滤出DictMapList中 item.DictId == obj.NextId 的所有项
        let nextItems = DictMapList.filter(item => item.DictId == obj.NextId);
        NavigationUtils.push(this.props.navigation, 'DicList', {
            title: Util.Parse.isChinese()?obj.Name:obj.EnName,
            Id: obj.Id,
            ParentValue:obj.BeforeParentName,
            callBack: (data) => {
                let dic = AdditionIfo&&AdditionIfo.DictItemList&&AdditionIfo.DictItemList.find(item => item.DictId === obj.Id);
                const prevSelectName = dic ? dic.ItemName : undefined;
                const isChanged = prevSelectName !== undefined && prevSelectName !== data.Name;
                if (isChanged && obj.NextId) {
                    this._clearCascadeByNextId(obj.NextId);
                }
                //nextItems中ParentName和data.Name相同的所有项
                let nextItemsSame = nextItems.filter(item => item.ParentName == data.Name);
                if(nextItemsSame.length > 0){
                    workDicList.forEach(item => {
                        if(item.Id == nextItemsSame?.[0]?.DictId){
                            item.showNext = true;
                            item.BeforeParentName = data.Name;
                            item.BeforeParentNameList = [data.Name];
                        }
                    })
                }else{
                    workDicList.forEach(item => {
                        if(item.Id == obj.NextId){
                            item.showNext = false;
                            item.BeforeParentName = undefined;
                            item.BeforeParentNameList = [];
                        }
                    })
                }
                if (dic) {
                    dic.DictId = obj.Id;
                    dic.Id = obj.Id;
                    dic.DictName = obj.Name;
                    dic.DictEnName = obj.EnName;
                    dic.ItemId = data.Id;
                    dic.ItemSerialNumber = data.SerialNumber;
                    dic.ItemName = data.Name;
                    dic.ItemEnName = data.EnName;
                    dic.EnName = obj.EnName;
                    dic.ItemInput = data.SerialNumber+" - "+data.Name+" - "+data.EnName;
                    dic.DictCode = obj.Code
                    dic.NeedInput = obj.NeedInput
                } else {
                    let model = {
                        DictId: obj.Id,
                        Id: obj.Id,
                        DictName: obj.Name,
                        EnName: obj.EnName,
                        DictEnName: obj.EnName,
                        ItemId: data.Id,
                        ItemSerialNumber: data.SerialNumber,
                        ItemName: data.Name,
                        ItemEnName: data.EnName,
                        RemarkNo:obj.RemarkNo,
                        ItemInput:data.SerialNumber+" - "+data.Name+" - "+data.EnName,
                        DictCode: obj.Code,
                        NeedInput:obj.NeedInput,
                        BeforeParentName: obj.BeforeParentName
                    }
                    AdditionIfo&&AdditionIfo.DictItemList.push(model);
                }
                this.setState({});

            }
        })
    }
    render() {
        const { AdditionIfo, customerInfo, userInfo, ApproveOrigin, DicList,fromNo,PdfDictList } = this.props;
        const { diffDicList,diffArr } = this.state;
        if (!customerInfo || !customerInfo.Setting) return null;
        let additonArr = UserInfoUtil.Addition(customerInfo);
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
                {
                    additonArr.length > 0 ?
                        additonArr.map((obj, index) => {
                            return (
                                <View key={index} style={styles.row}>
                                    <CustomText text={obj.name} style={{ flex: 3 }} />
                                    <CustomeTextInput style={{ flex: 7 }} placeholder={obj.state?'必填':'选填'} value={AdditionIfo[obj.en]} onChangeText={(text) => { AdditionIfo[obj.en] = text; this.setState({}) }} />
                                </View>
                            )
                        })
                        : null
                }
                {
                    !DicList && diffArr  ?
                    diffDicList.map((obj, index) => {
                            if (userInfo && userInfo.Customer && userInfo.Customer.Id === Customer.DRHJ) {
                                if (obj.Name === '实施阶段' && ApproveOrigin.OriginType === 2) {
                                    return null;
                                }
                            }
                            let itemIndex =AdditionIfo&&AdditionIfo.DictItemList&&AdditionIfo.DictItemList.find(item => 
                                // obj.NeedInput ? item.DictName === obj.Name : item.DictId === obj.Id
                                item.DictCode == obj.Code
                            );
                            if(itemIndex){
                                itemIndex.BusinessCategory = obj.BusinessCategory
                                itemIndex.Id = obj.Id
                                itemIndex.DictId = obj.Id
                                itemIndex.DictName = obj.Name
                                itemIndex.DictEnName = obj.EnName
                                itemIndex.Sort = obj.Sort
                                itemIndex.Remark = obj.Remark
                                itemIndex.EnRemark = obj.EnRemark
                                itemIndex.ShowInOrder = obj.ShowInOrder
                                itemIndex.DictCode = obj.Code
                                itemIndex.NeedInput = obj.NeedInput
                            }
                            const isCascadeChild = obj.BeforeParentNameList && obj.BeforeParentNameList.length > 0;
                            return (
                                obj.BusinessCategory&fromNo && obj.showNext && (obj.ShowInOrder || isCascadeChild)? //判断指定业务
                                <View key={index} style={styles.row}>
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
                                    />
                                </View>
                                // <View key={index} style={styles.row}>
                                //     {obj.IsRequire?<HighLight name={Util.Parse.isChinese()? obj.Name:obj.EnName} style={{ height:20,backgroundColor:'#fff',alignItems:'center',justifyContent: 'center',marginTop:10,fontSize:14 }} value={''}/>:<CustomText text={Util.Parse.isChinese()? obj.Name:obj.EnName} style={{ height:20,backgroundColor:'#fff',alignItems:'center',marginTop:10,fontSize:14 }} />}
                                //     {
                                //         obj.NeedInput ?
                                //             <View style={{ height:40,justifyContent:'center' }}>
                                //                 <CustomeTextInput value={itemIndex && itemIndex.ItemName} 
                                //                                   style={{borderColor:obj.IsRequire&& !(itemIndex && itemIndex.ItemName)?Theme.redColor:'#fff',height:40,borderBottomWidth:1,color:Theme.commonFontColor,fontSize:14,}} 
                                //                                   placeholder={Util.Parse.isChinese()?obj.Remark?obj.Remark:'请输入':obj.EnRemark} 
                                //                                   placeholderTextColor={Theme.promptFontColor}
                                //                                 //   editable={obj.IsEditInput}
                                //                                   onChangeText={(text) => {
                                //                                         this._valueCHange(text, obj);
                                //                                   }} />
                                //             </View>
                                //             :
                                //             <View style={{ justifyContent:'center' ,flexDirection:'row',borderColor:obj.IsRequire&& !(itemIndex&&itemIndex.ItemName)?Theme.redColor:'#fff',borderBottomWidth:1}}>
                                //                 <CustomText text={itemIndex ? (Util.Parse.isChinese()?itemIndex.ItemName:itemIndex.ItemEnName) :(Util.Parse.isChinese()? obj.Remark: obj.EnRemark)} 
                                //                             style={{ color: itemIndex ? Theme.commonFontColor: '#ccc', flex: 1, paddingTop:10,fontSize:14}} 
                                //                             onPress={this._toSelectDicList.bind(this, obj)} />
                                //                 <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} style={{height:40,paddingTop:9}} />
                                //             </View>
                                //     }
                                // </View>
                                :null
                            )
                        })
                        : null
                }
                {
                    DicList && DicList.length > 0 ?//申请单
                        DicList.map((obj, index) => {
                            const nextIdArr = [];
                            DicList.forEach(i => {
                                if (i && i.NextId) nextIdArr.push(i.NextId);
                            });
                            const showNext = (obj.showNext === undefined || obj.showNext === null)
                                ? (nextIdArr.indexOf(obj.Id) === -1)
                                : obj.showNext;
                            let itemIndex =AdditionIfo&&AdditionIfo.DictItemList&&AdditionIfo.DictItemList.find(item =>
                                (obj.Code !== undefined && item.DictCode == obj.Code) || item.DictId === obj.Id
                            );
                            return (
                                showNext ?
                                <View key={index} style={styles.row}>
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
                                </View>
                                : null
                                // <View key={index} style={styles.row}>
                                //     {/* <CustomText text={obj.Name} style={{ flex: 3 }} /> */}
                                //     {obj.IsRequire?<HighLight name={obj.Name} value={itemIndex}/>:<CustomText text={obj.Name} style={{ flex: 3 }} />}
                                //     {
                                //         obj.NeedInput ?
                                //             <View style={{ height:40,justifyContent:'center' }}>
                                //             <CustomeTextInput style={{ flex: 7 }} value={itemIndex && itemIndex.ItemName} 
                                //                               placeholder={obj.Remark}  onChangeText={(text) => {
                                //                 this._valueCHange(text, obj);
                                //             }} />
                                //             </View>
                                //             :
                                //             <View style={{ justifyContent:'center' ,flexDirection:'row',borderColor:obj.IsRequire&& !(itemIndex&&itemIndex.ItemName)?Theme.redColor:'#fff',borderBottomWidth:1}}>
                                //                 <CustomText text={itemIndex ? itemIndex.ItemName : obj.Remark} style={{ color: itemIndex ? Theme.commonFontColor: '#ccc', flex: 1, paddingTop:10,fontSize:14}} 
                                //                 onPress={this._toSelectDicList.bind(this, itemIndex)} />
                                //                 <Ionicons name={'ios-arrow-forward'} size={20} color={'lightgray'} />
                                //             </View>
                                //     }
                                // </View>
                            )
                        })
                        : null
                }
            </View>
        )
    }
}
const getStatePorps = state => ({
    compSwitch:state.compSwitch.bool, 
})
// export default connect(getStatePorps)(withNavigation(AdditionInfoView));
// 使用 Hook 包装类组件以获取 navigation
export default function(props) {
    const navigation = useNavigation();
    return <AdditionInfoView {...props} navigation={navigation} />
}

const styles = StyleSheet.create({
    view: {
        backgroundColor: 'white',
        marginHorizontal: 10,
        marginTop:10,
        borderRadius:6,
        paddingVertical:10
    },
    row: {
        marginHorizontal: 20,
        borderBottomColor: Theme.lineColor,
        // borderBottomWidth: 1,
    },
    rowRight: {
        flex: 7,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    }
})