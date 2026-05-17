import React from 'react';
import {
    View,
    StyleSheet
} from 'react-native';
import SuperView from '../../super/SuperView';
import ViewUtil from '../../util/ViewUtil';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import CommonService from '../../service/CommonService';
import { SelectView } from '../../custom/HighLight';

export default class AddApprovalScreen extends SuperView {
    constructor(props) {
        super(props);
        this._navigationHeaderView = {
            title: '审批授权人',
        }
        this._tabBarBottomView = {
            bottomInset: true,
            bottomColor: '#fff'
        }
        this.state = {
            passenger: null,
            addApproveAgentList: [],
        }
    }

    componentDidMount() {
        this.showLoadingView();
        CommonService.getUserInfo().then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                let obj = response.data;
                let AgentList = [];
                obj.AuthorizedApprovePerson.map((item) => {
                    if (item.Id && item.Id != 0) {
                        AgentList.push(item);
                    }
                })
                this.setState({
                    passenger: obj,
                    addApproveAgentList: AgentList,
                })
            } else {
                this.toastMsg(response.message || '获取数据失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }

    _approvalOfficer = () => {
        const { addApproveAgentList, passenger } = this.state;
        return (
            <SelectView titleName={'审批授权人'}
                required={false}
                _clickOnpress={() => {
                    this.showAlertView('设置审批授权人，可以代替您审批');
                }}
                _haveInfoAler={true}
                _selectName={''}
                _callBack={() => {
                    if (addApproveAgentList.length < 2) {
                        this.push('SearchBookerScreen', {
                            _from: '审批授权人',
                            callBack: (data) => {
                                addApproveAgentList.push(data);
                                passenger.AuthorizedApprovePerson = addApproveAgentList
                                this.setState({})
                            }
                        })
                    }
                }}
            />
        )
    }

    _addApproveAgent = () => {
        const { addApproveAgentList, passenger } = this.state;
        return (
            addApproveAgentList && addApproveAgentList.map((item, index) => {
                return (
                    <View style={styles.shouquanrenItemStyle} key={index}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <CustomText text={addApproveAgentList[index].Name ? addApproveAgentList[index].Name : '请选择'} style={{ color: Theme.commonFontColor, fontSize: 14 }}></CustomText>
                            <CustomText text={' '} style={{ color: Theme.commonFontColor, fontSize: 14 }}></CustomText>
                            <CustomText text={addApproveAgentList[index].Email ? addApproveAgentList[index].Email : ''} style={{ color: Theme.commonFontColor, fontSize: 14 }}></CustomText>
                        </View>
                        <AntDesign name={'delete'}
                            size={20}
                            style={{ marginLeft: 10 }}
                            color={Theme.theme}
                            onPress={() => {
                                addApproveAgentList.splice(index, 1);
                                passenger.AuthorizedApprovePerson = addApproveAgentList
                                this.setState({})
                            }}
                        />
                    </View>
                )
            })
        )
    }

    _save = () => {
        const { passenger, addApproveAgentList } = this.state;
        if (!passenger) {
            this.toastMsg('获取数据失败');
            return;
        }
        passenger.AuthorizedApprovePerson = addApproveAgentList;
        this.showLoadingView();
        CommonService.CurrentUserEditAuthorizedApprove(passenger).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                this.showAlertView('设置审批授权人成功', () => {
                    return ViewUtil.getAlertButton('确定', () => {
                        this.dismissAlertView();
                        this.pop();
                    })
                })
            } else {
                this.toastMsg(response.message || '设置失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '设置异常');
        })
    }

    renderBody() {
        const { passenger } = this.state;
        if (!passenger) return null;
        return (
            <View style={{ flex: 1, backgroundColor: Theme.normalBg }}>
                <View style={{ flex: 1, margin: 15, backgroundColor: '#fff', borderRadius: 5, padding: 15,height: 200 }}>
                    {this._approvalOfficer()}
                    {this._addApproveAgent()}
                </View>
                {ViewUtil.getThemeButton('保存', this._save)}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    shouquanrenItemStyle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        height: 50,
        alignItems: 'center',
        borderColor: Theme.lineColor
    }
})
