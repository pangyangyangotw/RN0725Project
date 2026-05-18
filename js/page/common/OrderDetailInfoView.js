import React from 'react';
import {
    View,
    Image,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableHighlight
} from 'react-native';
import PropTypes from 'prop-types';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';
import Util from '../../util/Util';
import CommonEnum from '../../enum/CommonEnum';
import RNFetchBlob from 'rn-fetch-blob';
import ViewUtil from '../../util/ViewUtil';
export default class OrderDetailInfoView extends React.PureComponent {
    static propTypes = {
        order: PropTypes.object.isRequired,
        customerInfo: PropTypes.object.isRequired,
        otwThis:PropTypes.object,
        showImage:PropTypes.func,
        fromApplyOrder:PropTypes.bool
    }

    _renderMailInfo = () => {
        const { order, customerInfo } = this.props;
        if (!order.MailingMethodDesc || order.MailingMethod === 0) return null;
        let MailingRemark = '';
        if (customerInfo && customerInfo.Setting && customerInfo.Setting.InvoiceRequestSetting) {
            const DeliveryItems = customerInfo.Setting.InvoiceRequestSetting.DeliveryItems;
            const DeliveryItem = DeliveryItems.find(item => item.MailingMethod === order.MailingMethod);
            if (DeliveryItem) {
                MailingRemark = DeliveryItem.Remark;
            }
        }
        return (
            <View style={{ backgroundColor: 'white', padding: 5,marginHorizontal:10,}}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomColor: '#e6e6e6', borderBottomWidth: 1 }}>
                    <CustomText text='配送方式' style={{ color: Theme.aidFontColor }} />
                    <CustomText text={order.MailingMethodDesc} style={{ color: Theme.annotatedFontColor }} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <CustomText style={{ color: Theme.aidFontColor }} text='配送信息' />
                    {
                        order.MailingInfo ?
                            <View style={{ paddingVertical: 5 }}>
                                {
                                    order.MailingInfo.DisplayRemark ?
                                        <CustomText text={order.MailingInfo.DisplayRemark + ' ' + (order.MailingInfo.ExpressName ? order.MailingInfo.ExpressName : '') + ' ' + (order.MailingInfo.ExpressNumber ? order.MailingInfo.ExpressNumber : '')} style={{ color: Theme.annotatedFontColor }} />
                                        : null
                                }
                                {order.MailingInfo.Addressee ? <CustomText style={{ color: Theme.annotatedFontColor }} text={order.MailingInfo.Addressee + ' ' + order.MailingInfo.Mobile} /> : null}
                                {order.MailingInfo.ProvinceName ? <CustomText style={{ color: Theme.annotatedFontColor }} text={order.MailingInfo.ProvinceName + ' ' + order.MailingInfo.CityName + ' ' + order.MailingInfo.DistrictName + ' ' + order.MailingInfo.StreetAddress} /> : null}
                                {order.MailingInfo.ExpressName ? <CustomText style={{ color: Theme.annotatedFontColor }} text={order.MailingInfo.ExpressName + ' ' + order.MailingInfo.ExpressNumber} /> : null}
                            </View>
                            : null
                    }
                </View>
            </View>
        )
    }
    /**
      * 费用信息
      */
    _dictInfo() {
        const { order } = this.props;
        if (!order) return;
        let addition = order.AdditionInfo|| order.Addition || {};
        let dictList = [];
        if (order.FeeType == 1) {
            if (order.ApproveOrigin) {
                dictList.push({
                    key: '费用归属',
                    value: order.ApproveOrigin.Desc,
                    ShowInOrder:true
                });
            }
        }
        if (addition.ApproveNo) {
            dictList.push({
                key: '审批单号',
                value: addition.ApproveNo
            });
        }
        if (addition.Remark) {
            dictList.push({
                key: '备注',
                value: addition.Remark
            });
        }
        if (addition.TravelResult) {
            dictList.push({
                key: '出差原因',
                value: addition.TravelResult
            });
        }
        if (addition.CostCenter) {
            dictList.push({
                key: '成本中心',
                value: addition.CostCenter
            });
        }
        if (addition.DictItemList) {
            addition.DictItemList.forEach(item => {
                let value = null;
                if (item.ItemInput) {
                    value =Util.Parse.isChinese()?(item.ItemName?item.ItemName:''): item.ItemEnName?item.ItemEnName:(item.ItemName?item.ItemName:'');
                } else {
                    if (item.ItemName) {
                        value = Util.Parse.isChinese()?item.ItemName: item.ItemEnName?item.ItemEnName:item.ItemName;
                    } else {
                        value = '';
                    }
                    // if (item.ItemSerialNumber) {
                    //     value += '（' + item.ItemSerialNumber + '）';
                    // }
                }
                // if (value) {
                    dictList.push({
                        key: Util.Parse.isChinese()? item.DictName: item.DictEnName?item.DictEnName:item.DictName,
                        value: value,
                        ShowInOrder:item.ShowInOrder
                    });
                // }
            });
        }
        if (dictList.length === 0) return null;
        return (
            <View style={{ backgroundColor: 'white', paddingHorizontal: 20, marginHorizontal: 10, borderRadius:6,flex:1,marginTop: 10,paddingBottom:10 }}>
                {
                    dictList.map((item, index) => {
                        return (
                            <View key={index} style={styles.dicView}>
                                <CustomText text={item.key} style={{ color: Theme.commonFontColor,fontSize:14,flex:3,textAlign:'left' }} />
                                <CustomText text={item.value} style={{ color: Theme.fontColor ,fontSize:14,flex:7,textAlign:'right'}} />
                            </View>
                        )
                    })
                }
            </View>
        );
    }
    /**
     *  出差单号
     */
    _travelSerinumber = () => {
        const { order,otwThis} = this.props;
        if (!order || !order.ApplyInfo) return null;
        return (
                <TouchableOpacity style={{ backgroundColor: 'white',borderRadius:4,justifyContent:'flex-end',marginHorizontal:10,marginTop: 10}}
                    onPress={()=>{otwThis.push('ApplicationOrderDetail',{Id: order.ApplyId})}}
                >
                    <View style={{ flexDirection: 'row',paddingHorizontal:20 ,alignItems:'center',justifyContent:'space-between', height: 44}}>
                        <CustomText style={{ fontSize: 14, color: Theme.aidFontColor, textDecorationLine:'underline'}} text='出差单号' />
                        <CustomText style={{  fontSize: 14, color: Theme.annotatedFontColor, textDecorationLine:'underline' }} text={order.ApplyInfo.SerialNumber} />
                    </View>
                    {/* <CustomText style={{  color: Theme.aidFontColor }} text={order.ApplyInfo.ExternalCode} /> */}
                </TouchableOpacity>
        )
    }
    //支付方式
    _payType = () => {
        const { order ,fromApplyChange} = this.props;
        if (!order || fromApplyChange) return null;
        return (
            <View style={{ flexDirection: 'row', height: 44, paddingHorizontal: 20, backgroundColor: 'white', alignItems: 'center',borderRadius:6,marginHorizontal:10,marginTop: 10 }}>
                <CustomText style={{ color: Theme.commonFontColor,fontSize:14 }} text='支付方式' />
                {
                    order.SettleTypeDesc ? <CustomText style={{ flex: 1, textAlign: 'right', fontSize: 14, color: Theme.fontColor }} text={order.SettleTypeDesc} /> :
                        <CustomText style={{ flex: 1, textAlign: 'right', fontSize: 14, color: Theme.fontColor }} text={order.PaymentType === CommonEnum.PaymnetSettleType.Cash ? '在线支付' : (order.PaymentType === CommonEnum.PaymnetSettleType.Prestored ? '钱包支付' : "企业月结")} />
                }

            </View>
        )
    }
    /**
     * 审批人信息
     */
    _approvelInfo = () => {
        const { order } = this.props;
        if (!order) return null;
        let result = order;
        const { ApproveJsonInfo, CustomerEmployee, ApprovedList } = result;
        let approvalArr = [];
           // 获取提交人
           var submitModel = {
            name: typeof CustomerEmployee === 'string' && CustomerEmployee ? JSON.parse(CustomerEmployee).Name : CustomerEmployee.Name,
            CreateTime: result.CreateTime,
            status: '提交申请',
            image: require('../../res/Uimage/dot.png')
        }
        approvalArr.push(submitModel);
        if (ApproveJsonInfo == null || JSON.parse(ApproveJsonInfo).length == 0) {
            return null;
        } else {
            if (ApprovedList == null || ApprovedList.length == 0) {
                JSON.parse(ApproveJsonInfo).map((item)=>{
                    let currentModel = {
                        name: item.levelPerpson?.[0]?.text,
                        level: item.level,
                        status: "待审批",
                        image: require('../../res/Uimage/dot_.png')
                    }
                    approvalArr.push(currentModel);
                })
                
            } else {
                ApprovedList.sort(this._compare('CreateTime'));
                for (let i = 0; i < ApprovedList.length; i++) {
                    let obj = ApprovedList[i];
                    if (obj.StatusDesc === '不同意' || obj.Status === 2) {
                        let model = {
                            name: obj.ApproverName,
                            status: '审批驳回',
                            CreateTime: obj.CreateTime,
                            level:obj.level,
                            image: require('../../res/Uimage/dot.png')
                        }
                        approvalArr.push(model);
                        break;
                    } else {
                        let model = {
                            name: obj.ApproverName,
                            status: '审批通过',
                            CreateTime: obj.CreateTime,
                            level:obj.level,
                            image: require('../../res/Uimage/dot.png')
                        }
                        approvalArr.push(model);
                    }
                }
                let ApproveJsonInfo = JSON.parse(result.ApproveJsonInfo);
                var lastObj = ApprovedList[ApprovedList.length - 1];
                if (lastObj.Status === 1) {
                    if (ApproveJsonInfo && Array.isArray(ApproveJsonInfo) && (ApproveJsonInfo.length !== ApprovedList.length)) {
                        for (const item of ApproveJsonInfo) {
                            if (item.level == (ApprovedList.length + 1)) {
                                approvalArr.push({
                                    name: item.levelPerpson?.[0]?.text,
                                    level:item.level,
                                    status: '待审批',
                                    image: require('../../res/Uimage/dot_.png')
                                })
                                break;
                            }
                        }
                    }
                }
            }
         
            let approViewArr = [];
            for (let i = 0; i < approvalArr.length; i++) {
                var obj = approvalArr[i];
                var time = obj.CreateTime;
                time = Util.Date.toDate(time);
                var name = obj?.name?.split('--')[0];
                var level = obj.level
                approViewArr.push(
                    <View key={i} >
                        <View style={{ flexDirection:'row' }}>
                            <View style={{alignItems:'center'}}>
                                <View style={{width:20,alignItems:'center',justifyContent:'center'}}>
                                    <Image style={{ width:(obj.status==="待审批")? 10 : 20, height: (obj.status==="待审批")? 10 : 20 }} source={obj.status=="待审批" ? require('../../res/Uimage/dot.png') :require('../../res/Uimage/dot_.png')} />
                                </View>
                                { <View style={{height:40,width:1,backgroundColor:(i==approvalArr.length-1 )?'#fff':obj.status==="待审批"? Theme.lineColor : Theme.theme,marginTop:-1}}></View>}
                            </View> 
                            <View style={{flex:1,marginLeft:20}}>
                                <View style={{ flexDirection:'row',marginTop: obj.status=='待审批' ? -5 : 0 ,justifyContent:'space-between'}} >
                                    <View style={{flexDirection:'row'}}>
                                    <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={obj.status=='提交申请'?'预订人':'审批人'} />
                                    {level&&<CustomText style={{ color: Theme.commonFontColor, fontSize: 14 }} text={Util.Parse.isChinese()?'('+ level+'级'+')':'('+'Level-'+level+')' } />}
                                    {name?<CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'（'+ name+'）'} />:null}
                                    </View>
                                    <CustomText style={{ color:obj.status=='待审批'? Theme.theme : Theme.assistFontColor, fontSize: 14 }} text={obj.status} />
                                </View>   
                                <Text allowFontScaling={false} style={{ color: Theme.promptFontColor, fontSize: 14,marginTop:5 }}>{(time ? time.format('yyyy-MM-dd') : '') + ' ' + (time ? time.format('HH:mm') : '')}</Text>
                            </View>
                        </View>
                    </View>
                )
            }
            return (
                <View style={{ backgroundColor:'#fff',marginHorizontal:10,padding:20,borderRadius:6,marginTop: 10}}>
                     <View style={{flexDirection:'row',alignItems:'center',paddingBottom:10,borderBottomWidth:1,borderColor:Theme.lineColor,marginBottom:20}}>
                            <Image source={require('../../res/Uimage/shu.png')} style={{width:14,height:14}}/>
                            <CustomText text='审批记录' style={styles.titleStyle} />
                    </View>
                    {approViewArr}
                </View>
            )
        }
    }

    _compare(CreateTime) {
        return (object1, object2) => {
            var date1 = Util.Date.toDate(object1[CreateTime]);
            var date2 = Util.Date.toDate(object2[CreateTime]);
            return date1 - date2;
        }
    }

    _applyAttachmentList = ()=>{
        if(!this.props.order) return null;
        const{order,otwThis} = this.props;
        let pic = ['jpg','png','jpeg','gif']
        if(order.AttachmentList && order.AttachmentList.length > 0){
           return (
                      <View style={{ backgroundColor: "white", padding: 20 ,borderRadius:6,marginHorizontal:10,marginTop: 10}}>
                       {/* <CustomText text={'附件2'} style={{ fontWeight: 'bold', color: Theme.theme,flex:2 }} /> */}
                         <View style={{flexDirection:'row',alignItems:'center'}}>
                            <Image source={require('../../res/Uimage/shu.png')} style={{width:14,height:14}}/>
                            <CustomText text='附件' style={styles.titleStyle} />
                         </View>
                         <View style={{ backgroundColor: Theme.lineColor, height: 1, marginTop: 5 }}></View>
                       <View style={{ marginTop: 10,justifyContent:'center' ,flex:8}}>
                           {
                              order.AttachmentList.map((obj,index)=>{
                                   if(!obj) return null;
                                   let pname = obj.Name.substring( obj.Name.lastIndexOf(".")+1)
                                   let houzhui = pname.toLowerCase()
                                    if((/.pdf$/).test(obj.Url)){
                                        return <TouchableOpacity style={{flexDirection:'row',alignItems:'center'}} onPress={()=> otwThis.push('PdfDisplay', { url: { uri: obj.Url } })}>
                                                    <Image  style={{width:25,height:25,margin:10,tintColor:Theme.theme}} source={require("../../res/image/icon-80-cur.png")} />
                                                    <CustomText key={index} text = {obj.Name} style={{marginBottom:10,color:Theme.theme}} />
                                                </TouchableOpacity>
                                    }
                                    return(
                                        <View>
                                            {
                                                pic.indexOf(houzhui)>-1 //判断文件是否是图片
                                                ?
                                                <TouchableOpacity style={{flexDirection:'row',alignItems:'center'}} underlayColor='transparent' onPress={this.props.showImage.bind(this,obj.Url)} key={index} >
                                                    <Image  style={{width:25,height:25,marginRight:10}} source={{uri:`${obj.Url}`}} />
                                                    <CustomText style={{ color: 'gray', fontSize: 10, marginTop: 5,width:260 }} text={obj.Name} />
                                                </TouchableOpacity>
                                                :
                                                <TouchableOpacity style={{flexDirection:'row',alignItems:'center'}} underlayColor='transparent' onPress={this._showDownLoad.bind(this,obj)} key={index} >
                                                    <Image  style={{width:25,height:25,marginRight:10}} source={require("../../res/image/icon-80-cur.png")} />
                                                    <CustomText style={{ color: 'gray', fontSize: 14, marginTop: 5,width:260 }} text={obj.Name} />
                                                </TouchableOpacity>                                                 
                                            }
                                        </View>
                                    )
                              }) 
                           }
                       </View>
                   </View>
            )
        }
    }

    _attachmentList =()=>{
        if(!this.props.order) return null;
        const{order,otwThis} = this.props;
        let pic = ['jpg','png','jpeg','gif']
        if(order.Attachment&& order.Attachment && order.Attachment.AttachmentItems.length > 0){
           return (
                      <View style={{ marginTop: 10, backgroundColor: "white", paddingVertical: 10 ,borderRadius:6,marginHorizontal:10,paddingHorizontal: 20}}>
                       <View style={{flexDirection:'row',alignItems:'center',paddingBottom:10,borderBottomWidth:1,borderColor:Theme.lineColor}}>
                            <Image source={require('../../res/Uimage/shu.png')} style={{width:14,height:14}}/>
                            <CustomText text='附件' style={styles.titleStyle} />
                       </View>
                       <View style={{ justifyContent:'center' ,flex:8}}>
                           {
                              order.Attachment.AttachmentItems.map((obj,index)=>{
                                   if(!obj) return null;
                                   let pname = obj.FileName.substring( obj.FileName.lastIndexOf(".")+1)
                                   let houzhui = pname.toLowerCase()
                                    if((/.pdf$/).test(obj.Url)){
                                        return <View style={{flexDirection:'row',alignItems:'center'}}>
                                                  <Image  style={{width:25,height:25,margin:10,tintColor:Theme.theme}} source={require("../../res/image/icon-80-cur.png")} />
                                                  <CustomText key={index} text = {obj.FileName} style={{color:Theme.theme,fontSize: 13}} onPress={()=> otwThis.push('PdfDisplay', { url: { uri: obj.Url } })}/>
                                                </View>
                                    }
                                    return(
                                        <View>
                                            {
                                                pic.indexOf(houzhui)>-1 //判断文件是否是图片
                                                ?
                                                <TouchableOpacity style={{flexDirection:'row',alignItems:'center'}} underlayColor='transparent' onPress={this.props.showImage.bind(this,obj.Url)} key={index} >
                                                    <Image  style={{width:25,height:25,margin:10,borderRadius:4}} source={{uri:`${obj.Url}`}} />
                                                    <CustomText style={{ color: 'gray', fontSize: 13, marginTop: 5,color:Theme.theme,width:260 }} text={obj.FileName} />
                                                </TouchableOpacity>
                                                :
                                                <TouchableOpacity style={{flexDirection:'row',alignItems:'center'}} underlayColor='transparent' onPress={this._showDownLoad.bind(this,obj)} key={index} >
                                                    <Image  style={{width:25,height:25,margin:10}} source={require("../../res/image/icon-80-cur.png")} />
                                                    <CustomText style={{ color: 'gray', fontSize: 13, marginTop: 5,color:Theme.theme,width:260 }} text={obj.FileName} />
                                                </TouchableOpacity>                                                 
                                            }
                                        </View>
                                    )
                              }) 
                           }
                       </View>
                   </View>
            )
        }
    }

    _showDownLoad = (obj)=>{
        const{otwThis} = this.props;
        otwThis.showAlertView('是否下载文件？', () => {
            return ViewUtil.getAlertButton('取消', () => {
                otwThis.dismissAlertView();
            }, '确定', () => {
                otwThis.dismissAlertView();
                this._downLoad(obj)
            })
        })
    }

    _downLoad = (obj)=>{
        const{otwThis,fromApplyOrder} = this.props;
        let path = RNFetchBlob.fs.dirs.DocumentDir
        let fileName = fromApplyOrder?obj.Name:obj.FileName
        RNFetchBlob
        .config({
          // add this option that makes response data to be stored as a file,
          // this is much more performant.
          fileCache : true,
          path: path +'/'+ fileName,
        })
        .fetch('GET', obj.Url, {
          //some headers ..
        })
        .then((res) => {
            // the temp file path
            // console.log('The file saved to ', res.path())
            otwThis.showAlertView('下载成功,保存路径'+res.path(), () => {
            return ViewUtil.getAlertButton('确定', () => {
                otwThis.dismissAlertView();
            })
        })
        })
    }

    render() {
        const {fromApplyOrder,onlyImage} = this.props;
        return (
            <View>
                {onlyImage?null:this._payType()}
                {/* {onlyImage?null:this._renderMailInfo()} */}
                {onlyImage?null:this._dictInfo()}
                {onlyImage?null:this._travelSerinumber()}  
                {fromApplyOrder?this._applyAttachmentList():this._attachmentList()}
                {onlyImage?null:this._approvelInfo()}

            </View>
        )
    }
}

const styles = StyleSheet.create({
    dicView: {
        flexDirection: 'row',
        alignItems: 'center',
        // height: 44,
        justifyContent: "space-between",
        borderBottomColor: Theme.lineColor,
        marginTop:10,
        flex:1,
        paddingVertical:3
    },
    titleStyle:{ 
        fontWeight: 'bold', 
        color: Theme.fontColor,
        fontSize:14 
    }
})