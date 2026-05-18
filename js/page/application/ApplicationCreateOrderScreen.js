import React from 'react';
import {
    View,
    Image,
    StyleSheet,
    TouchableHighlight,
    DeviceEventEmitter,
    TouchableOpacity,
    Text,Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Alert
} from 'react-native';
import SuperView from '../../super/SuperView';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import UserInfoDao from '../../service/UserInfoDao';
import UserInfoUtil from '../../util/UserInfoUtil';
import PassnegerView from '../common/PassnegerView';
import DepartView from '../common/DepartView';
import ViewUtil from '../../util/ViewUtil';
import AdditionInfoView from '../common/AdditionInfoView';
import CommonService from '../../service/CommonService';
import CustomText from '../../custom/CustomText';
import CustomTextInput from '../../custom/CustomTextInput';
import Theme from '../../res/styles/Theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import RNFetchBlob from 'rn-fetch-blob';
import I18nUtil from '../../util/I18nUtil';
import Util from '../../util/Util';
import ApplicationService from '../../service/ApplicationService';
import NavigationUtils from '../../navigator/NavigationUtils';
import HighLight from '../../custom/HighLight';
import {HighLight2,TitleView2} from '../../custom/HighLight';
import { connect } from 'react-redux';
import RNFileSelect from 'react-native-file-select-mk';
import TextViewTitle from '../../custom/TextViewTitle';
import { Bt_inputView }  from '../../custom/HighLight';
import CustomActioSheet from '../../custom/CustomActionSheet';
import Key from '../../res/styles/Key';
import StorageUtil from '../../util/StorageUtil';
class ApplicationCreateOrderScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '新建出差申请单'
        }
        this._tabBarBottomView = {
            bottomInset: true
        }
        this.state = {
            // 员工
            employees: this.params.applyEmployees||[],
            //常旅客
            travellers: [],
            // 用户信息
            userInfo: {},
            // 客户配置信息
            customerInfo: {},
            // 费用归属
            ApproveOrigin: this.params.ApproverInfo&&this.params.ApproverInfo.ApproveOrigin,
            // 数据字典
            AdditionInfo: {
                DictItemList: []
            },
            DicList: [],
            //出差事由
            tripReason: "",
            //费用预算
            costBudget: this.params.CostBudget,
            //行程
            tripList: [{ goDate: null, arrivalDate: null, goCity: null, arrivalCity: null, isNational: false, isSingle: false, select: [] }],
            //多目的地
            moreDestination:{BeginTime:null,EndTime:null,JourneyType:2,Departure:null,Destination:null,CategoryIntro:null,DepartureList:null,DestinationList:null,BusinessCategory:null},
            isSingle:false,
            DepartureArr:[],
            DestinationArr:[],
            ImageInfo: null,
            selectType:[],
            fileList:[],
            ApproverInfo: this.params.ApproverInfo,
            emailHisArr:[],//存放历史邮箱
            emailArrStr:'',
            contactName:null,
            contactMobile:null,
            isEditMobile:false,
            isEditEmail:false,
        }
    }

    componentDidMount() {
        
        const {  ApproveOrigin } = this.state;
        const {ReferenceEmployeeId,applyEmployees,ReferenceEmployee} = this.params;
        UserInfoDao.getUserInfo().then(userInfo => {
            let user = UserInfoUtil.getUser(userInfo);
            // // 添加用户
            // employees.push(user);
            let PassengerId = applyEmployees&&applyEmployees.length>0 ? applyEmployees[applyEmployees.length-1].PassengerOrigin.EmployeeId : null
            // let model1={
            //     ReferenceEmployee:{Id:ReferenceEmployeeId},
            //     ReferencePassengerId:{Id:PassengerId},
            // }

            let model={
                ReferenceEmployeeId:ReferenceEmployeeId,
                ReferencePassengerId:PassengerId,
                // ReferenceEmployee:{Id:ReferenceEmployeeId},
                // ReferencePassengerId:{Id:PassengerId},
            }
            CommonService.customerInfo(model).then(response => {
                this.setState({
                    userInfo,
                    customerInfo:response.data
                },()=>{
                    // this.getApprover()
                })
            }).catch(error => {
                this.toastMsg(error.message);
            })
        }).catch(error => {
            this.toastMsg(error.message);
        })
        this._loadCurrentDicList();        
  
        StorageUtil.loadKeyId(Key.NoticeEmail).then((emailStr)=>{
            if(emailStr){
                let emails = emailStr.split(',')
                this.setState({
                    emailHisArr:emails
                })
            }
        })       
  
        // DeviceEventEmitter.addListener('xxxName’, Function)
        this.pageEmit = DeviceEventEmitter.emit('homeRefresh', {homeRefresh: 1});
       
    }

    componentWillUnmount(){    
         this.pageEmit && this.pageEmit.remove();
     };

    _loadCurrentDicList = () => {
        const {AdditionInfo} = this.state;
        const {ReferenceEmployeeId, applyEmployees} = this.params;
        let PassengerId = applyEmployees&&applyEmployees.length>0 ? applyEmployees[applyEmployees.length-1].PassengerOrigin.EmployeeId: null
        this.showLoadingView();
        let model = {
            OrderCategory: 0,
            ShowInApply: true,
            ShowInDemand: false,
            ReferenceEmployeeId:ReferenceEmployeeId?ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:PassengerId,
        }
        CommonService.CurrentDictList(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if (response.data) {
                    let arr = response.data || []
                    AdditionInfo.DictItemList = arr&&arr.map((item)=>({
                        DictCode:item.Code,
                        DictEnName:item.EnName,
                        DictId:item.Id,
                        DictName:item.Name,
                        FormatRegexp:item.FormatRegexp,
                        Id:item.Id,
                        ItemEnName:null,
                        ItemId:"",
                        ItemInput:"",
                        ItemName:"",
                        NeedInput:item.NeedInput,
                        Remark:item.Remark,
                        RemarkNo:item.RemarkNo,
                        NextId:item.NextId,
                        ShowInOrder:item.ShowInOrder,
                    }))
                    this.setState({
                        DicList: arr,
                    })
                }
            } else {
                this.toastMsg(response.message || '获取数据失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }
    /**
     * 添加行程
     */
    _addTrip = () => {
        this.state.tripList.push({ goDate: null, arrivalDate: null, goCity: null, arrivalCity: null, isNational: false, isSingle: false, select: [] });
        this.setState({});
    }
    /**
     * 删除行程
     */
    _deleteTrip = (index) => {
        this.state.tripList.splice(index, 1);
        this.setState({});
    }
    /**
     * 国内国际切换
     */
    _nationalChange = (obj) => {
        obj.isNational = !obj.isNational;
        this.setState({});
    }
    /**
     * 行程类型
     */
    _tripTypeChange = (obj) => {
        obj.isSingle = !obj.isSingle;
        this.setState({});
    }
    /**
     * 多目的地行程类型
     */
    _tripTypeChange2 = (obj) => {
        this.state.isSingle = !this.state.isSingle;
        this.setState({});
    }
    /**
     * 添加业务类目
     */
    _addCategory = (obj) => {
        // const {customerInfo} = this.state;
       let customerInfo = this.props.customerInfo_userInfo.customerInfo
        this.push('ApplicationCategory', {
            select: obj.select || [],customerInfo ,callBack: (data) => {
                obj.select = data;
                this.setState({});
            }
        });
    }
     /**
     * 多目的地添加业务类目
     */
    _addCategory2 = (selectType) => {
        const {customerInfo} = this.state;
        this.push('ApplicationCategory', {
            select: selectType || [], customerInfo,callBack: (data) => {
                this.setState({
                    selectType:data
                });
            }
        });   
    }
    /**
     * 选择日期
     */
    _toSelectDate = (obj, index) => {
        this.push('Calendar', {
            num: index, date: obj.goDate,
            backDate: (date) => {
                if (index == 1) {
                    obj.goDate = date;
                    this.setState({

                    })
                } else {
                    obj.arrivalDate = date
                    this.setState({
                    })
                }
            }
        })
    }
     /**
     * 多目的地选择日期
     */
    _toSelectDate2 = (obj, index) => {
        this.push('Calendar', {
            num: index, date: obj.BeginTime,
            backDate: (date) => {
                if (index == 1) {
                    obj.BeginTime = date.format('yyyy-MM-dd', true);
                    this.setState({
                    })
                } else {
                    obj.EndTime = date.format('yyyy-MM-dd', true)
                    this.setState({
                    })
                }
            }
        })
    }
     /**
     * 多目的地选择出发地
     */
    _selectDeparture = (obj) => {
        this.push('ApplicationMoreCity', {
            national: !obj.isSingle,
            title: '出发城市',
            callBack: (data) => {
                    this.setState({
                        DepartureArr:data
                    })
            }
        })
    }
     /**
     * 选择目的地
     */
    _selectDestination = (obj) => {
        this.push('ApplicationMoreCity', {
            national: !obj.isNational,
            title: '到达城市',
            callBack: (data) => {
                    this.setState({
                        DestinationArr:data
                    })
            }
        })
    }

    _toSelectCity = (obj, index) => {
        this.push('ApplicationCity', {
            national: !obj.isNational,
            title: index === 1 ? '出发城市' : '到达城市',
            callBack: (data) => {
                if (index === 1) {
                    obj.goCity = data;
                    this.setState({
                    })
                } else {
                    obj.arrivalCity = data;
                    this.setState({
                    })
                }
            }
        })
    }

    _submitOrder = () => {
        const { customerInfo, DicList, ApproveOrigin, tripList, employees, 
                travellers, tripReason, ImageUrl, AdditionInfo, costBudget, 
                ImageInfo,moreDestination,DepartureArr,DestinationArr,selectType,fileList, 
                ApproverInfo,emailHisArr,contactName,contactMobile,emailArrStr } = this.state;
        const {applyEmployees,ReferenceEmployeeId, ReferenceEmployee} = this.params;
        let visibleDicIdSet = null;
        const getVisibleDictIdSet = function (dictConfigList, dictMapList, dictItemList) {
            var configs = dictConfigList || [];
            var mapList = dictMapList || [];
            var configById = {};
            var childIdSet = new Set();
            configs.forEach(function (cfg) {
                if (cfg && cfg.Id !== undefined) {
                    configById[cfg.Id] = cfg;
                }
                if (cfg && cfg.NextId) {
                    childIdSet.add(cfg.NextId);
                }
            });
            var rootIds = [];
            configs.forEach(function (cfg) {
                if (cfg && cfg.Id !== undefined && !childIdSet.has(cfg.Id)) {
                    rootIds.push(cfg.Id);
                }
            });
            var visibleIdSet = new Set();
            var visiting = new Set();
            var visit = function (id) {
                if (!id || visibleIdSet.has(id) || visiting.has(id)) return;
                visiting.add(id);
                visibleIdSet.add(id);
                var cfg = configById[id];
                var nextId = cfg && cfg.NextId;
                if (nextId) {
                    var parentItem = dictItemList && dictItemList.find(function (it) {
                        if (!it) return false;
                        if (cfg && cfg.Code !== undefined && it.DictCode == cfg.Code) return true;
                        return it.DictId == id;
                    });
                    var parentName = parentItem && parentItem.ItemName;
                    var rules = mapList && mapList.filter(function (m) { return m && m.DictId == nextId; });
                    if (!rules || rules.length === 0) {
                        visit(nextId);
                    } else if (parentName && rules.some(function (m) { return m && m.ParentName == parentName; })) {
                        visit(nextId);
                    }
                }
                visiting.delete(id);
            };
            rootIds.forEach(function (id) { visit(id); });
            return visibleIdSet;
        };
        if(emailHisArr.indexOf(emailArrStr) === -1){
            emailHisArr.push(emailArrStr)    
        }
       //emailHisArr大于8，删除最前面添加的
        if(emailHisArr.length > 8){
            emailHisArr.shift()
        }
        let emailArr2 = emailHisArr.join(',')
        StorageUtil.saveKeyId(Key.NoticeEmail, emailArr2);//保存历史邮箱，存在本地
        let PassengerId = applyEmployees&&applyEmployees.length>0 ? applyEmployees[applyEmployees.length-1].PassengerOrigin.EmployeeId : null
        let addition = UserInfoUtil.Addition(customerInfo);
        for (let index = 0; index < addition.length; index++) {
            const obj = addition[index];
            if (obj.state && !AdditionInfo[obj.en]) {
                this.toastMsg(obj.name + '不能为空');
                return;
            }
        }
        if (!tripReason) {
            this.toastMsg("请填写出差原因");
            return;
        }
        // if (customerInfo && customerInfo.Setting && customerInfo.Setting.IsShowCostBudget) {
        //     if (!costBudget) {
        //         this.toastMsg('请填写费用预算');
        //         return;
        //     }
        // }
        if (DicList) {
            const nextIdArr = [];
            DicList.forEach(i => {
                if (i && i.NextId) nextIdArr.push(i.NextId);
            });
            visibleDicIdSet = new Set();
            for (let i = 0; i < DicList.length; i++) {
                const obj = DicList[i];
                const isVisible = (obj.showNext === undefined || obj.showNext === null)
                    ? (nextIdArr.indexOf(obj.Id) === -1)
                    : obj.showNext;
                if (!isVisible) {
                    continue;
                }
                visibleDicIdSet.add(obj.Id);
                if (obj.IsRequire) {
                    let dicItem = AdditionInfo.DictItemList&&AdditionInfo.DictItemList.find(dic => 
                        (obj.Code !== undefined && dic.DictCode == obj.Code) || dic.DictId === obj.Id
                    );
                    if (!dicItem) {
                        this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(obj.Name)));
                        return;
                    } else {
                        if (obj.NeedInput && !dicItem.ItemName) {
                            this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(obj.Name)));
                            return;
                        } else if (!obj.NeedInput && !dicItem.ItemId) {
                            this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(obj.Name)));
                            return;
                        }
                    }
                }
            }
        }
        
        if (ApproveOrigin&&ApproveOrigin.OriginType === 1 && ApproveOrigin.ProjectId === '0') {
            let proLablel = customerInfo&&customerInfo.Setting.ProjectLabel ? customerInfo.Setting.ProjectLabel : '项目出差';
            this.toastMsg('请选择' + proLablel);
            return;
        }
        if (ApproveOrigin.OriginType === 3 && ApproveOrigin.ApproverId === '0') {
            this.toastMsg('请选择授权人');
            return;
        }
        // if (tripList.length === 0) {
        //     this.toastMsg('请添加行程信息');
        //     return;
        // }
        let journeyList = [];
        if(customerInfo&&customerInfo.Setting&&customerInfo.Setting.TravelApplyMode==2)
        {
            if(!moreDestination.BeginTime){
                this.toastMsg('出发日期不能为空');
                return;
            }
            if(!moreDestination.EndTime){
                this.toastMsg('结束日期不能为空');
                return;
            }

            if((new Date(moreDestination.BeginTime)).getTime() > (new Date(moreDestination.EndTime)).getTime()){
                this.toastMsg('出发日日期不能大于结束日期');
                return;
            }

            if(selectType&&selectType.length===0){
                this.toastMsg('请选择业务类目');
                return;
            }
            let CategoryList = null;
            selectType.forEach(item => {
                if (!CategoryList) {
                    CategoryList = item.Key;
                } else {
                    CategoryList = CategoryList | item.Key;
                }
            })
            moreDestination.BusinessCategory = CategoryList
           let deparNewArr=[]
           let destinaNewArr=[]
           let departureList = []
           let destinationList = []
           DepartureArr.map((item)=>{
                deparNewArr.push(item.Name)
           })
           DestinationArr.map((item)=>{
            destinaNewArr.push(item.Name)
           })
           moreDestination.Departure=deparNewArr.join(`,`);
           moreDestination.Destination=destinaNewArr.join(`,`);
           if(!moreDestination.Departure){
                this.toastMsg('出发城市不能为空');
                return;
            }
           if(!moreDestination.Destination){
                this.toastMsg('抵达城市不能为空');
                return;
           }
           departureList = DepartureArr.map((item,index)=>({
            Code:item.Code,
            Name:item.Name,
            EnName:item.EnName,
            NationalCode:item.NationalCode,
            Domestic:item.NationalCode=='CN'?true:false
            }))
            destinationList = DestinationArr.map((item,index)=>({
            Code:item.Code,
            Name:item.Name,
            EnName:item.EnName,
            NationalCode:item.NationalCode,
            Domestic:item.NationalCode=='CN'?true:false
            }))
           moreDestination.DepartureList = departureList;
           moreDestination.DestinationList = destinationList;
           moreDestination.JourneyType = this.state.isSingle?1:2 
        }else{
            for (let index = 0; index < tripList.length; index++) {
                const obj = tripList[index];
                if (!obj.goCity) {
                    this.toastMsg('出发城市不能为空');
                    return;
                }
                if (!obj.arrivalCity) {
                    this.toastMsg('抵达城市不能为空');
                    return;
                }
                if (!obj.goDate) {
                    this.toastMsg('出发日期不能为空');
                    return;
                }
                if (!obj.arrivalDate) {
                    this.toastMsg('结束日期不能为空');
                    return;
                }

                if ((new Date(obj.goDate)).getTime() > (new Date(obj.arrivalDate)).getTime()) {
                    this.toastMsg('出发日日期不能大于结束日期');
                    return;
                }
                
                let CategoryList = null;

                if (!obj.select || obj.select.length === 0) {
                    this.toastMsg('业务类目不能为空');
                    return;
                }
                if (obj.select.length === 0) {
                    this.toastMsg('请选择业务类目');
                    return;
                }
                obj.select.forEach(item => {
                    if (!CategoryList) {
                        CategoryList = item.Key;
                    } else {
                        CategoryList = CategoryList | item.Key;
                    }
                })
                journeyList.push({
                    Departure: obj.goCity.Name,
                    DepartureId: obj.goCity.Code,
                    Destination: obj.arrivalCity.Name,
                    DestinationId: obj.arrivalCity.Code,
                    BeginTime: obj.goDate.format('yyyy-MM-dd', true),
                    EndTime: obj.arrivalDate.format('yyyy-MM-dd', true),
                    BusinessCategory: CategoryList,
                    JourneyType: obj.isSingle ? 1 : 2 // 单程1 往返2
                });
            }            
        }

        // //项目部门
        // if(customerInfo&&customerInfo.Setting.IsApplyHiddenDepartment && !customerInfo.Setting.IsApplyHiddenProject && !(ApproverInfo&&ApproverInfo.ProjectId)){
        //    this.toastMsg('请选择项目出差');
        //    return;
        // }

        let TravellerList = [];
        employees.forEach(obj => {
            TravellerList.push({
                Name: obj.Name,
                Surname: obj.Surname,
                GivenName: obj.GivenName,
                CardType: obj.CertificateType,
                ardNo: obj.CertificateNumber,
                Mobile: obj.Mobile,
                Email: obj.Email,
                EmployeeId: obj.PassengerOrigin.EmployeeId? obj.PassengerOrigin.EmployeeId : '0',
                Sex: obj.Gender,
                SexDesc:obj.SexDesc,
                Birthday: obj.Birthday,
                Addition: obj.Addition,
                IsVip: obj.IsVip,
                certificate: {
                    SerialNumber: obj.CertificateNumber,
                    Type: Util.Read.certificateType(obj.CertificateType),
                    Sex: obj.Gender,
                    Expire: obj.CertificateExpire,
                    Birthday: obj.Birthday,
                    IssueNationName:obj.IssueNationName,
                    IssueNationCode:obj.IssueNationCode,
                    NationalCode:obj.NationalityCode?obj.NationalityCode:obj.NationalCode?obj.NationalCode:null,
                    NationalName:obj.Nationality?obj.Nationality:obj.NationalName?obj.NationalName:null,
                }
            })
        })
        travellers.forEach(obj => {
            TravellerList.push({
                Name: obj.Name,
                Mobile: obj.Mobile,
                TravellerId: obj.Id ? obj.Id : '0',
                R2: '',
                Birthday:obj.Birthday,
                SexDesc:obj.Gender===2?'女':'男',
                Sex:obj.Gender,
                certificate: {
                    SerialNumber: obj.CertificateNumber,
                    Type: Util.Read.certificateType(obj.CertificateType),
                    Sex: obj.Gender,
                    Expire: obj.CertificateExpire,
                    Birthday: obj.Birthday,
                    IssueNationName:obj.IssueNationName,
                    IssueNationCode:obj.IssueNationCode,
                    NationalCode:obj.NationalityCode,
                    NationalName:obj.Nationality,
                }
            })
        })
      
        for (let index = 0; index < TravellerList.length; index++) {
            const obj = TravellerList[index];
            if(!obj.Name){
                this.toastMsg('姓名不能为空');
                return;
            }
            if(!obj.certificate.SerialNumber){
                this.toastMsg('证件号不能为空');
                return;
            }
            if(!obj.certificate.Expire && obj.certificate.Type!=1){
                this.toastMsg('请选择证件有效期');
                return;
            }
            if(!obj.certificate.IssueNationName && obj.certificate.Type!=1){
                this.toastMsg('请选择证件签发国');
                return;
            }
            if(obj.certificate.Type!=1 &&!obj.certificate.Nationality && !obj.certificate.NationalName){
                this.toastMsg('国籍/地区不能为空1');
                return;
            }
            if(!obj.Birthday){
                this.toastMsg('出生日期不能为空');
                return
            }
            if(!obj.Mobile){
                this.toastMsg('手机号不能为空');
                return;
            }
            if(!obj.Gender && !obj.Sex){
                this.toastMsg('性别不能为空');
                return;
            }
            if(!obj.Email&& customerInfo&&customerInfo.EmailRequired){
                this.toastMsg('邮箱不能为空');
                return;
            }
            if(customerInfo.EmployeeDictList&&customerInfo.EmployeeDictList.length>0){
                const visibleEmployeeIdSet = getVisibleDictIdSet(customerInfo.EmployeeDictList, customerInfo.DictMapList, obj.Addition && obj.Addition.DictItemList);
                for (let i = 0; i < customerInfo.EmployeeDictList.length; i++) {
                   if (!visibleEmployeeIdSet.has(customerInfo.EmployeeDictList[i].Id)) {
                       continue;
                   }
                   let itemIndex =  obj.Addition&&obj.Addition.DictItemList.find(item => {
                       if (!item) return false;
                       if (customerInfo.EmployeeDictList[i].Code !== undefined && item.DictCode == customerInfo.EmployeeDictList[i].Code) return true;
                       return item.DictId == customerInfo.EmployeeDictList[i].Id;
                   });
                   if(!itemIndex){
                       itemIndex = customerInfo.EmployeeDictList[i]
                       itemIndex.DictName =Util.Parse.isChinese() ? customerInfo.EmployeeDictList[i].Name : customerInfo.EmployeeDictList[i].EnName
                   }
                   if(itemIndex.IsRequire){
                       if (itemIndex.NeedInput && !itemIndex.ItemName) {
                           this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(itemIndex.DictName)));
                           return;
                       } else if (!itemIndex.NeedInput && !itemIndex.ItemId) {
                           this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(itemIndex.DictName)));
                           return;
                       }
                   }
               }
           }
        }

        let approvalList = [];
        if(ApproverInfo?.WorkflowChooseOneOrAll){
            const steps = ApproverInfo?.ApprovalModel?.Steps;
            if( Array.isArray(steps) && steps.length > 0){
                steps.forEach((item)=>{
                    if(item?.approvalPerson){
                        item.approvalPerson.DepartmentName = item.approvalPerson.extendtext
                        approvalList.push(item.approvalPerson);
                    }  
                }) 
                if(steps.length > approvalList.length){
                    this.toastMsg('请选择审批人');
                    return;
                }
            }
        }

        const setting = customerInfo&&customerInfo.Setting;
        if(setting&&setting.AttachmentConfig&&setting.AttachmentConfig.TravelApplyNecessary){
            if(fileList.length==0){
                this.toastMsg('未上传附件');
                return;
            }
        }
        
        let Contact = {
            Name: contactName,
            Mobile: contactMobile,
            Email: emailArrStr,
        }
        const submitAddition = (() => {
            const raw = AdditionInfo || {};
            const dictConfigList = Array.isArray(DicList) ? DicList : [];
            const existCompanyDictItemList = Array.isArray(raw.DictItemList) ? raw.DictItemList : [];
            const nullCompanyDictList = dictConfigList.map((item) => ({
                DictCode: item.Code,
                DictEnName: item.EnName,
                DictId: item.Id,
                DictName: item.Name,
                FormatRegexp: item.FormatRegexp,
                Id: item.Id,
                ItemEnName: null,
                ItemId: "",
                ItemInput: "",
                ItemName: "",
                NeedInput: item.NeedInput,
                Remark: item.Remark,
                RemarkNo: item.RemarkNo,
                NextId: item.NextId,
                ShowInOrder: item.ShowInOrder,
                BusinessCategory: item.BusinessCategory,
            }));
            existCompanyDictItemList.forEach((it) => {
                if (!it) return;
                const dictId = it.DictId || it.Id;
                let index = -1;
                if (dictId !== undefined && dictId !== null) {
                    index = nullCompanyDictList.findIndex(e => e && (e.Id == dictId || e.DictId == dictId));
                }
                if (index === -1 && it.DictCode !== undefined) {
                    index = nullCompanyDictList.findIndex(e => e && e.DictCode == it.DictCode);
                }
                if (index > -1) {
                    const base = nullCompanyDictList[index];
                    nullCompanyDictList[index] = {
                        ...base,
                        ...it,
                        Id: base.Id,
                        DictId: base.DictId,
                        DictCode: base.DictCode,
                        DictName: base.DictName,
                        DictEnName: base.DictEnName,
                        NeedInput: base.NeedInput,
                        NextId: base.NextId,
                        ShowInOrder: base.ShowInOrder,
                        FormatRegexp: base.FormatRegexp,
                        Remark: base.Remark,
                        RemarkNo: base.RemarkNo,
                        BusinessCategory: base.BusinessCategory,
                    };
                }
            });
            const childIdSet = new Set();
            dictConfigList.forEach((cfg) => {
                if (cfg && cfg.NextId) childIdSet.add(cfg.NextId);
            });
            const visibleCompanyIdSet = getVisibleDictIdSet(dictConfigList, customerInfo && customerInfo.DictMapList, nullCompanyDictList);
            return {
                ...raw,
                DictItemList: nullCompanyDictList.filter((it) => {
                    const id = it && (it.DictId || it.Id);
                    if (!id) return false;
                    if (!childIdSet.has(id)) return true;
                    return visibleCompanyIdSet && visibleCompanyIdSet.has(id);
                }),
            };
        })();
        
        let model = {  
            OrderType: 1,
            CostBudget: costBudget,
            TravelReason: tripReason,
            CostCenter: AdditionInfo.CostCenter,
            JourneyList: journeyList,
            Destination:moreDestination,
            TravelApplyMode:customerInfo&&customerInfo.Setting&&customerInfo.Setting.TravelApplyMode,
            Addition: submitAddition,
            TravellerList: TravellerList,
            ApproveOrigin: ApproveOrigin,
            // AttachmentList: [{ Name: ImageInfo && ImageInfo.fileName, FileId: ImageInfo && ImageInfo.data, Url: ImageUrl }],
            AttachmentList:fileList,
            // ReferenceEmployeeId:ReferenceEmployeeId,
            // ReferencePassengerId:PassengerId,
            ReferenceEmployee:{Id:ReferenceEmployeeId},
            ReferencePassenger:{Id:PassengerId},
            approvers:ApproverInfo&&ApproverInfo.WorkflowChooseOneOrAll?approvalList:null,
            Contact:Contact,
        }
        this.showLoadingView();
        ApplicationService.SubmitRequisition(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                this.showAlertView('您的申请单已申请成功', () => {
                    return ViewUtil.getAlertButton('确定', () => {
                        this.dismissAlertView();
                        NavigationUtils.pop(this.props.navigation);
                        // this.props.navigation.goBack() 
                        // this.props.navigation.state.params.refresh();
                        // this.props.navigation.state.params.refresh();
                    })
                })
            } else {
                this.toastMsg(response.message || '提交订单失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '提交订单异常');
        })
    }

    /**
    *  选择图片
    */
    _selectImage = () => {
        const options = {
            mediaType: 'photo',
            quality: 0.75,
            selectionLimit: 1
        };
        const onResult = (response) => {
            if (!response || response.didCancel) return;
            if (response.errorCode) {
                this.toastMsg(response.errorMessage || '选择图片失败');
                return;
            }
            const asset = response.assets && response.assets[0];
            if (!asset || !asset.uri) return;
            this.setState({
                ImageInfo: asset
            }, () => {
                this._uploadImage(asset.uri);
            })
        };
        Alert.alert(I18nUtil.translate('请选择'), '', [
            { text: I18nUtil.translate('拍照'), onPress: () => launchCamera(options, onResult) },
            { text: I18nUtil.translate('选择相册'), onPress: () => launchImageLibrary(options, onResult) },
            { text: I18nUtil.translate('取消'), style: 'cancel' },
        ]);
    }
    /**
     * uploadImage
     */
    _uploadImage = (ImageUrl) => {
        const {fileList} = this.state;
        if(fileList.length>4){
            this.toastMsg('最多只能上传5个文件')
            return;
        }
        let url = null;
        if (ImageUrl.search('file://') > -1) {
            url = ImageUrl.slice(7);
        } else {
            url = ImageUrl;
        }
        let pos = url.lastIndexOf('/')
        let fileName = url.substr(pos+1)
        let pname = fileName.substring(0, fileName.lastIndexOf("."))
        let phouzhui = url.substring(url.lastIndexOf(".")+1)
        let data = RNFetchBlob.wrap(url)
        let model = [];
        model.unshift({ name: pname , data: data, filename: fileName, type:phouzhui});

        CommonService.TravelApplyFileUpload(model).then(response => {
            if (response && response.success) {
               fileList.push(response.data[0]);
              this.setState({
                  fileList:fileList
              })
            } else {
              this.toastMsg('上传失败');
            }
        }).catch(error => {
          this.toastMsg('上传失败');
        })
    }

    _selectFile=()=>{
        const {fileList} = this.state;
        if(fileList.length>4){
            this.toastMsg('最多只能上传5个文件')
            return;
        }
        RNFileSelect.showFileList((res) => {
            if(!res){return}
            let pos = res.path.lastIndexOf('/')
            let fileName = res.path.substr(pos+1)
            let pname = fileName.substring(0, fileName.lastIndexOf("."))
            let phouzhui = res.path.substring(res.path.lastIndexOf(".")+1)
            if (res.type === 'cancel') {
              //用户取消
            } else if (res.type === 'path') {
              let data = RNFetchBlob.wrap(res.path)
              let model = [];
              model.unshift({ name: pname , data: data, filename: fileName, type:phouzhui});
              // 选中单个文件
              CommonService.TravelApplyFileUpload(model).then(response => {
                  if (response && response.success) {
                     fileList.push(response.data[0]);
                    this.setState({
                        fileList:fileList
                    })
                  } else {
                    //   this.toastMsg(response.message || '获取数据失败');
                    this.toastMsg('上传失败');
                  }
              }).catch(error => {
                //   this.hideLoadingView();
                //   this.toastMsg(error.message || '获取数据异常');
                this.toastMsg('上传失败');
              })
            } else if (res.type === 'paths') {
              // 选中多个文件 看管理器支持情况目前采用默认的，只有会调用path
            } else if (res.type === 'error') {
              // 选择文件失败 
              this.toastMsg('上传失败');
            }
          })    
    }

    renderBody() {
        const { employees, travellers, userInfo, ImageUrl, customerInfo, ApproveOrigin, AdditionInfo, DicList, tripReason, costBudget,fileList, options,ApproverInfo,emailHisArr } = this.state;
        return (
            <View style={{flex:1}}>
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <PassnegerView
                    from={'apply'}
                    userInfo={userInfo}
                    customerInfo={customerInfo}
                    employees={employees}
                    travellers={travellers}
                    otwThis={this} 
                    feeType={1}
                />
                
                {/* <View style={{marginTop:10, marginHorizontal:10,borderRadius:4,paddingLeft:20, flexDirection:Util.Parse.isChinese()?'row':'column', paddingTop:Util.Parse.isChinese()?0:10,height:Util.Parse.isChinese()?4:56, alignItems:Util.Parse.isChinese()? 'center':'flex-start', backgroundColor: 'white', paddingHorizontal:20, height:50,marginHorizontal:10,borderRadius:4 }}>
                    <HighLight name={'出差原因'} value={tripReason}/>
                    <CustomTextInput returnKeyType='done' style={{ }} placeholder='请填写出差原因' value={tripReason} onChangeText={(text) => this.setState({ tripReason: text })} />
                </View> */}
                 <View style={styles.resonStyle}>
                    <TitleView2 title={'出差原因'} required={true}></TitleView2>
                    <CustomTextInput returnKeyType='done' style={{flex: 1,textAlignVertical: 'top'}} placeholder='请填写出差原因' multiline={true}  value={tripReason} onChangeText={(text) => this.setState({ tripReason: text })} />
                </View>
                {
                    this._renderTripList()
                }
                <View style={{marginTop:10}}>
                {
                    customerInfo && customerInfo.Setting && customerInfo.Setting.IsShowCostBudget?
                        <View style={{ flexDirection: 'row', height: 44, alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 10,marginHorizontal:10,borderRadius:4 }}>
                            <CustomText style={{ flex: 3 }} text='费用预算' />
                            <CustomText style={{ flex: 7 }} text={costBudget} />
                        </View>
                    : null
                }
                
                {  
                   ApproveOrigin.OriginType==2 && customerInfo && customerInfo.Setting &&customerInfo.Setting.IsApplyHiddenDepartment ? null:
                    <View style={{  flexDirection: 'row', height: 44, alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 20 ,marginHorizontal:10,borderRadius:4}}>
                        <CustomText style={{ flex: 3 }} text={ApproveOrigin.OriginTypeDesc}/>
                        <CustomText style={{ flex: 7 }} text={ApproveOrigin.Desc} />
                    </View>
                }
                </View>
                <View style={{borderRadius:4,}}>
                <AdditionInfoView
                    AdditionIfo={AdditionInfo}
                    customerInfo={customerInfo}
                    userInfo={userInfo}
                    ApproveOrigin={ApproveOrigin}
                    DicList={DicList}
                    fromNo = {1}//申请单 BusinessCategory
                />
                </View>
                {this._linkManInfoText()}
                <View style={{ marginTop: 10,marginHorizontal:10,padding:10,backgroundColor: 'white',borderRadius:6 }}>
                <View style={{ marginTop: 10 }}>
                    <View style={[styles.row]}>
                        {
                           customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.TravelApplyNecessary?
                            <TitleView2 title={'上传附件'} required={true}></TitleView2>
                            :
                            <TitleView2 title={'上传附件'}></TitleView2>
                        }
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "space-between",paddingVertical:10 }}>
                            <TouchableOpacity style={[{ borderColor: Theme.theme }, styles.borderAll]} 
                                onPress={()=>{
                                    this._selectFile()
                                }}
                            >
                                <CustomText text='从文件夹上传' style={{color: Theme.theme }} />
                            </TouchableOpacity>
                            {
                                Platform.OS === 'android'?null:
                                <TouchableOpacity style={[{ borderColor: Theme.theme,marginLeft:10  }, styles.borderAll]} 
                                    onPress={()=>{
                                    this._selectImage()
                                    }}
                                >
                                    <CustomText text='打开相册或相机' style={{color: Theme.theme }} />
                                </TouchableOpacity>
                            }
                        </View>
                    </View>                   
                </View>
                <View style={{ backgroundColor: 'white', padding: 10,justifyContent:'space-between'}}>
                        <CustomText text={'单个文件最大5MB，数量最多5个，格式为:'} style={{fontSize:11, color:'red'}} ></CustomText>
                        <CustomText text={'jpg,png,jpeg,bmp,gif,xlsx,xls,txt,doc,docx,md,pdf,ppt,pptx,wps;'} style={{fontSize:11, color:'red'}}></CustomText>                                  
                </View>
                </View>
                {
                    fileList.map((item,index)=>{
                        return(
                            <View style={{ flexDirection: 'row',flex:1, height: 44, width:global.screenWidth, backgroundColor: 'white', paddingHorizontal: 10,justifyContent:'space-between'}}>
                                 <CustomText text={item.Name} style={{flex:3}}></CustomText>                 
                                 <AntDesign name={'delete'} onPress={()=>{
                                    fileList.splice(index,1);
                                    this.setState({})
                                 }} size={26} color={Theme.theme} style={{paddingRight:30}} />
                            </View>  
                        )
                    })
                }
                 {
                   ApproverInfo?.WorkflowChooseOneOrAll && ApproverInfo.ApprovalModel && ApproverInfo.ApprovalModel.Steps && ApproverInfo.ApprovalModel.Steps.length>0 ?
                        <View style={{backgroundColor:'#fff',marginTop:10}}>
                                <CustomText text='审批信息' style={{ margin: 10 }} />
                                {
                                    ApproverInfo.ApprovalModel?.Steps&&ApproverInfo.ApprovalModel.Steps.map((item,index)=>{
                                        if(this.params.approve){
                                            item.approvalPerson = item.Persons[0]
                                        }
                                        return(
                                            <View style={{ flex: 6,height:40,justifyContent:'center' ,flexDirection:'row',paddingHorizontal:10,borderBottomWidth:1,borderBottomColor:Theme.lineColor}}>
                                                <TouchableOpacity style={{flex: 7,flexDirection:'row'}} disabled={this.params.approve?true:false} 
                                                onPress={this._toSelecApproval.bind(this,item,index)}
                                                >
                                                    <CustomText text={index+1+'级审批人'} style={{ flex: 3, height:40, paddingTop:10}} />
                                                    <CustomText text={item.approvalPerson&&item.approvalPerson.Name} numberOfLines={2} style={{flex: 7, height:40, paddingTop:10,width:10}}/>
                                                </TouchableOpacity>
                                                <Ionicons name={'chevron-forward'} size={20} color={'lightgray'} style={{height:40,paddingTop:9}} />
                                            </View>
                                        )
                                    })
                                }
                        </View>
                    :null
                }
            </KeyboardAwareScrollView>
            {
                ViewUtil.getSubmitButton('确定', this._submitOrder)
            }
            </View>
        )
    }

    _linkManInfoText =()=>{
        const { isEditMobile,contactMobile,contactName,emailArrStr,emailHisArr,isEditEmail } = this.state
        return(
            <View style={{backgroundColor:'#fff',marginHorizontal:10,marginTop:10,borderRadius:6,paddingBottom:15,paddingTop:10}} onPress={Keyboard.dismiss}>
                <TextViewTitle title={'知会人'} imgIcon={require('../../res/Uimage/shu.png')}/>
                <View style={{paddingHorizontal:20}}>
                        <Bt_inputView dicKey={'姓名'} 
                                        required={false}
                                        bt_text={contactName}//passenger.Name 
                                        _placeholder={'请输入姓名'} 
                                        _callBack={(text)=>{
                                            this.setState({contactName:text});
                                        }}
                        />

                        <Bt_inputView dicKey={'手机号'}
                                        required={false} 
                                        bt_text={isEditMobile ? contactMobile : contactMobile&&contactMobile.replace(/(\d{3})(\d{4})(\d{4})/,"$1****$3")} 
                                        _placeholder={'手机号'} 
                                        _onFocus={()=>{
                                                this.setState({ isEditMobile: true, contactMobile: '' });
                                        }}
                                        _onBlur={()=>{
                                                this.setState({ isEditMobile: false })
                                        }}
                                        keyboardType='numeric' 
                                        _callBack={(text)=>{
                                                this.setState({ contactMobile : text });
                                        }}
                        />
                        
                        <Bt_inputView dicKey={'Email'}
                                    required={false} 
                                    bt_text={emailArrStr} 
                                    _placeholder={'请输入电子邮箱'} 
                                    _onFocus={()=>{
                                            this.setState({ 
                                                isEditEmail: true 
                                            })
                                    }}
                                    _onBlur={()=>{
                                            this.setState({ isEditEmail: false })
                                    }}
                                    _callBack={(text)=>{
                                            
                                            this.setState({emailArrStr:text});
                                    }}
                        />
                     <CustomText text={'如需填写多个邮箱，请使分号 “;” 隔开'} style={{marginRight:10,color:Theme.assistFontColor}}></CustomText>
                    { 
                        isEditEmail?
                            <View style={{flexDirection:'row',flexWrap:'wrap'}}>
                            {
                                emailHisArr&&emailHisArr.map((item,index)=>{
                                    return(
                                        <TouchableOpacity style={{flexDirection:'row',padding:5,borderWidth:1,borderColor:Theme.theme,borderRadius:5,marginRight:10,justifyContent:'center',alignItems:'center',marginTop:10}} 
                                                          onPress={ () => {
                                                              this.setState({
                                                                emailArrStr:item
                                                              })
                                                          }}>
                                            <CustomText text={item} style={{color:Theme.theme}}></CustomText>
                                        </TouchableOpacity> 
                                    )
                                })
                            }
                            </View>
                        :null
                    }
                </View>
            </View>
        )  
    }
    
    _toSelecApproval=(item,index)=>{
        let personList = [];
        item.Persons.map((obj)=>{
            personList.push(obj.Id)
        })
        NavigationUtils.push(this.props.navigation, 'ChooseSinglePersonList', {
            title: '选择审批人',
            personList: personList,
            approvalCallBack: (data) => {
                item.approvalPerson = {
                    level:index+1,
                    Id:data.id,
                    Name:data.text,
                    extendtext:data.extendtext
                }
                this.setState({});
            }
        })
    }
    _renderTripList = () => {
        const { tripList,customerInfo,moreDestination,DepartureArr, DestinationArr,isSingle,selectType} = this.state;
        let subjectType2 = selectType && selectType.map(item => item.Value);
        return (
            customerInfo&&customerInfo.Setting&&customerInfo.Setting.TravelApplyMode==2?
            <View style={{ backgroundColor: "white", marginTop: 10,marginHorizontal:10,padding:10,borderRadius:6 }} >
                <TouchableHighlight underlayColor='transparent' onPress={this._deleteTrip.bind(this)}>
                    <View style={[styles.row, { justifyContent: "space-between" }]}>
                        {/* <CustomText text={`行程1`} style={{fontWeight:'bold'}}/> */}
                        <TitleView2 title={'行程'}  style={{}}></TitleView2>
                    </View>
                </TouchableHighlight>
                <View style={styles.row}>
                    <CustomText text='日期' style={{ width: 60 }} />
                    <CustomText style={{ flex: 1, textAlign: 'center', color: moreDestination.BeginTime ? null : "gray" }} onPress={this._toSelectDate2.bind(this,moreDestination,1)} text={moreDestination.BeginTime ? moreDestination.BeginTime : '开始日期'} />
                        <CustomText style={{ color: Theme.theme }} text='至' />
                    <CustomText style={{ flex: 1, textAlign: 'center', color: moreDestination.EndTime ? null : "gray" }} onPress={this._toSelectDate2.bind(this,moreDestination,2)} text={moreDestination.EndTime ? moreDestination.EndTime : '结束日期'} />
                </View>
                <TouchableHighlight underlayColor='transparent' onPress={this._selectDeparture.bind(this,moreDestination )}>
                    <View style={[styles.row,]}>
                        <CustomText text='出发地' style={{ flex: 4 }} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 18, justifyContent: "flex-end" }}>
                            { DepartureArr&&DepartureArr.length!=0?
                                DepartureArr.map((item, index)=>{
                                    return(
                                        <CustomText key={index} text={item.Name} style={{ fontSize: 13, color:'#333333',marginLeft:3}} />
                                    )
                                }):<CustomText text={'请选择出发地'} style={{ fontSize: 13, color:'gray',marginLeft:3}} />
                            }
                            <Ionicons name={'chevron-forward'} size={20} color={'lightgray'} style={{ marginLeft: 5 }} />
                        </View>
                    </View>
                </TouchableHighlight>
                <TouchableHighlight underlayColor='transparent' onPress={this._selectDestination.bind(this, moreDestination)}>
                    <View style={[styles.row,]}>
                        <CustomText text='目的地' style={{ flex: 4 }} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 18, justifyContent: "flex-end" }}>
                            { DestinationArr&&DestinationArr.length!=0?
                                DestinationArr.map((item, index)=>{
                                    return(
                                        <CustomText text={item.Name} style={{ fontSize: 13, color:'#333333',marginLeft:3}} />
                                    )
                                }):<CustomText text={'请选择目的地'} style={{ fontSize: 13, color:'gray',marginLeft:3}} />
                            }
                            <Ionicons name={'chevron-forward'} size={20} color={'lightgray'} style={{ marginLeft: 5 }} />
                        </View>
                    </View>
                </TouchableHighlight>
                <TouchableHighlight underlayColor='transparent' onPress={this._nationalChange.bind(this, moreDestination)}>
                    <View style={[styles.row,]}>
                        <CustomText text='国内/国际行程' style={{ flex: 3 }} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 4, justifyContent: "flex-end" }}>
                            <View style={[{marginRight:5, borderColor: !moreDestination.isNational ? Theme.theme : Theme.darkColor, backgroundColor: !moreDestination.isNational ? Theme.greenBg : '#fff',}, styles.borderAll]}>
                                <CustomText text='国内' style={{ color: !moreDestination.isNational ? Theme.theme : 'black' }} />
                            </View>
                            <View style={[{ borderColor: moreDestination.isNational ? Theme.theme : Theme.darkColor, backgroundColor: moreDestination.isNational ? Theme.greenBg : '#fff' }, styles.borderAll]} >
                                <CustomText text='国际' style={{ color: moreDestination.isNational ? Theme.theme : 'black' }} />
                            </View>
                        </View>
                    </View>
                </TouchableHighlight>
                <TouchableHighlight underlayColor='transparent' onPress={this._tripTypeChange2.bind(this, moreDestination)}>
                    <View style={[styles.row,]}>
                        <CustomText text='行程类型' style={{ flex: 3 }} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 3, justifyContent: "flex-end" }}>
                            <View style={[{marginRight:5, borderColor: isSingle ? Theme.theme : Theme.darkColor, backgroundColor:isSingle ? Theme.greenBg : '#fff' }, styles.borderAll]}>
                                <CustomText text='单程' style={{ color: isSingle ? Theme.theme : 'black' }} />
                            </View>
                            <View style={[{ borderColor: isSingle ? Theme.darkColor : Theme.theme, backgroundColor:!isSingle ? Theme.greenBg : '#fff' }, styles.borderAll]} >
                                <CustomText text='往返' style={{ color: isSingle ? 'black' : Theme.theme }} />
                            </View>
                        </View>
                    </View>
                </TouchableHighlight>
                <TouchableHighlight underlayColor='transparent' onPress={this._addCategory2.bind(this, selectType)}>
                    <View style={[styles.row1,]}>
                        <HighLight name={'业务类目'} value={subjectType2[0]} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 10, justifyContent: "space-between",flexWrap:'wrap' }}>
                           
                        </View>
                        <Ionicons name={'chevron-forward'} size={20} color={'lightgray'} style={{ marginLeft: 5 }} />
                    </View>
                </TouchableHighlight>
                {
                    subjectType2&&subjectType2.length>0?
                            <View style={{ flexDirection: 'row',flex:1,paddingVertical:15,marginHorizontal:10,flexWrap:'wrap',borderBottomWidth:1,borderColor:Theme.lineColor}}>
                            { 
                            subjectType2.map((item)=>{
                                    return(
                                        <View style={{ flexDirection: 'row'}}>
                                            <CustomText text={item}/>
                                            <CustomText text={'、'}/>
                                        </View>
                                    )
                                })
                            }
                        </View>
                    :null
                }
            </View>
            :
            <View style={{ backgroundColor: "white", marginTop: 10,marginHorizontal:10,padding:10,borderRadius:6 }}>
            {
                tripList.length > 0 ?
                    tripList.map((obj, index) => {

                        let subjectType = obj.select && obj.select.map(item => item.Value);
                        return (
                            <View key={index}>
                                <TouchableHighlight underlayColor='transparent' onPress={this._deleteTrip.bind(this, index)}>
                                    <View style={[styles.row, { justifyContent: "space-between" }]}>
                                        {/* <CustomText text={`行程${index + 1}`} /> */}
                                        <TitleView2 title={'行程'}  style={{}}></TitleView2>
                                        <Text style={{ flex: 1,color:Theme.fontColor }}>{ '（'+ (index + 1)+'）'}</Text>
                                        <AntDesign name={'delete'} size={20} color={Theme.theme} />
                                    </View>
                                </TouchableHighlight>
                                <View style={styles.row}>
                                    {/* <CustomText text='日期' style={{ width: 60 }} /> */}
                                    <HighLight2 name={'日期'} value1={obj.goDate} value2={obj.arrivalDate}/>
                                    <TouchableOpacity onPress={this._toSelectDate.bind(this, obj, 1)} style={{justifyContent:'center'}}>
                                    <CustomText style={{  textAlign: 'left',width:80, color: obj.goDate ? null : "gray"}}  text={obj.goDate ? obj.goDate.format('yyyy-MM-dd') : '开始日期'} />
                                    </TouchableOpacity>
                                    <CustomText style={{color: Theme.theme }} text='至' />
                                    <TouchableOpacity onPress={this._toSelectDate.bind(this, obj, 2)} style={{justifyContent:'center'}}>
                                    <CustomText style={{ textAlign: 'right', color: obj.arrivalDate ? null : "gray" ,width:80,}}  text={obj.arrivalDate ? obj.arrivalDate.format('yyyy-MM-dd') : '结束日期'} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.row}>
                                    {/* <CustomText text='地点' style={{ width: 60 }} /> */}
                                    <HighLight2 name={'地点'} value1={obj.goCity} value2={obj.arrivalCity}/>
                                    <TouchableOpacity onPress={this._toSelectCity.bind(this, obj, 1)} style={{justifyContent:'center'}}>
                                    <CustomText style={{textAlign: 'left',width:80,  color: obj.goCity ? null : "gray" }}  text={obj.goCity ? obj.goCity.Name : '出发城市'} />
                                    </TouchableOpacity>
                                        <CustomText style={{ color: Theme.theme }} text='至' />
                                    <TouchableOpacity onPress={this._toSelectCity.bind(this, obj, 2)} style={{justifyContent:'center'}}>
                                    <CustomText style={{ textAlign: 'right',width:80,  color: obj.arrivalCity ? null : "gray" }} text={obj.arrivalCity ? obj.arrivalCity.Name : '到达城市'} />
                                    </TouchableOpacity>
                                </View>
                                <TouchableHighlight underlayColor='transparent' onPress={this._nationalChange.bind(this, obj)}>
                                    <View style={[styles.row,]}>
                                        <CustomText text='国内/国际行程' style={{ flex: 3 }} />
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 4, justifyContent: "flex-end" }}>
                                            {/* <CustomText text={obj.isNational ? '国际' : '国内'} style={{ fontSize: 16 }} />
                                            <Ionicons name={'chevron-forward'} size={22} color={'lightgray'} style={{ marginLeft: 5 }} /> */}
                                            <View style={[{marginRight:5, borderColor: !obj.isNational ? Theme.theme : Theme.darkColor, backgroundColor: !obj.isNational ? Theme.greenBg :'#fff' }, styles.borderAll]}>
                                                <CustomText text='国内' style={{ color: !obj.isNational ? Theme.theme : 'black' }} />
                                            </View>
                                            <View style={[{ borderColor: obj.isNational ? Theme.theme : Theme.darkColor,backgroundColor: obj.isNational ? Theme.greenBg :'#fff'}, styles.borderAll]} >
                                                <CustomText text='国际' style={{ color: obj.isNational ? Theme.theme : 'black' }} />
                                            </View>
                                        </View>
                                    </View>
                                </TouchableHighlight>
                                <TouchableHighlight underlayColor='transparent' onPress={this._tripTypeChange.bind(this, obj)}>
                                    <View style={[styles.row,]}>
                                        <CustomText text='行程类型' style={{ flex: 6 }} />
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 3, justifyContent: "flex-end" }}>
                                            <View style={[{marginRight:5, borderColor: obj.isSingle ? Theme.theme : Theme.darkColor,backgroundColor: obj.isSingle ? Theme.greenBg :'#fff' }, styles.borderAll]}>
                                                <CustomText text='单程' style={{ color: obj.isSingle ? Theme.theme : 'black' }} />
                                            </View>
                                            <View style={[{ borderColor: obj.isSingle ? Theme.darkColor : Theme.theme,backgroundColor: obj.isSingle ? '#fff' :Theme.greenBg }, styles.borderAll]} >
                                                <CustomText text='往返' style={{ color: obj.isSingle ? 'black' : Theme.theme }} />
                                            </View>
                                        </View>
                                    </View>
                                </TouchableHighlight>
                                <TouchableHighlight underlayColor='transparent' onPress={this._addCategory.bind(this, obj)}>
                                    <View style={[styles.row1,]}>
                                        <View style={{flexDirection:'row',flex:Util.Parse.isChinese()?3:2,alignItems:'center'}}>
                                            <CustomText text={'业务类目'} />
                                            <CustomText text={'*'} style={{  color:'red',fontSize:18}} />
                                        </View>   
                                        <Ionicons name={'chevron-forward'} size={20} color={'lightgray'} style={{ marginLeft: 5 }} />
                                    </View>
                                </TouchableHighlight>
                                {
                                    subjectType&&subjectType.length>0?
                                            <View style={{ flexDirection: 'row',flex:1,paddingVertical:15,marginHorizontal:10,flexWrap:'wrap',borderBottomWidth:1,borderColor:Theme.lineColor}}>
                                            { 
                                            subjectType.map((item)=>{
                                                    return(
                                                        <View style={{ flexDirection: 'row'}}>
                                                            <CustomText text={item}/>
                                                            <CustomText text={'、'}/>
                                                        </View>
                                                    )
                                                })
                                            }
                                        </View>
                                    :null
                                }
                            </View>
                        )
                    })
                    : null
            }
            <TouchableHighlight onPress={this._addTrip} underlayColor='transparent'>
                <View style={{ flexDirection: 'row', justifyContent: 'center', padding: 15, alignItems: 'center' }}>
                    {/* <AntDesign name={'add'} size={20} color={Theme.theme} /> */}
                    <CustomText style={{color: Theme.theme,fontSize:14 }} text='继续添加' />
                </View>
            </TouchableHighlight>
        </View>
        )
    }
}
const getStatePorps = state => ({
    comp_userInfo:state.comp_userInfo,
    customerInfo_userInfo: state.customerInfo_userInfo
})
export default connect(getStatePorps)(ApplicationCreateOrderScreen);

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        marginHorizontal: 10,
        alignItems: 'center',
        // height: 44,
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        justifyContent:'space-between',
        flexWrap:'wrap',
        paddingVertical:10
    },
    row1: {
        flexDirection: 'row',
        marginHorizontal: 10,
        alignItems: 'center',
        // height: 44,
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
         justifyContent:'space-between',
         paddingVertical:10
    },
    row2: {
        flexDirection: 'row',
        marginHorizontal: 10,
        alignItems: 'center',
        // height: 44,
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
         justifyContent:'space-between',
         paddingVertical:15
    },
    borderAll: {
        // width: 60,
        // height: 25,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: "center",
        borderRadius: 3,
        paddingHorizontal:5,
        paddingVertical:3
    },
    resonStyle:{
        marginTop: 10,
        marginHorizontal: 10,
        borderRadius: 4,
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingTop: 10,
        minHeight: 80, 
    }
})
