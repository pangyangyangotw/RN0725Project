import React from 'react';
import {
    View,
    Animated,
    TouchableHighlight,
} from 'react-native';
import PropTypes from 'prop-types';
import Theme from '../../res/styles/Theme';
import AntDesign from 'react-native-vector-icons/AntDesign';
import CustomText from '../../custom/CustomText';
export default class ListSortView extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            viewHeight: new Animated.Value(0),
            disPlay: false
        }
    }

    show() {
        this.setState({
            disPlay: true
        }, () => {
            Animated.timing(this.state.viewHeight, {
                duration: 300,
                toValue: 160
            }).start();
        })
    }
    hide() {
        Animated.timing(this.state.viewHeight, {
            duration: 300,
            toValue: 0
        }).start(() => {
            this.setState({
                disPlay: false
            })
        })
    }

    static propTypes = {
        sort: PropTypes.string.isRequired,
        callBack: PropTypes.func.isRequired
    }

    _hide = (obj) => {
        const { callBack } = this.props;
        Animated.timing(this.state.viewHeight, {
            duration: 300,
            toValue: 0
        }).start(() => {
            this.setState({
                disPlay: false
            }, () => {
                callBack(obj);
            })
        })
    }


    render() {
        const { sort } = this.props;
        if (!this.state.disPlay) return null;
        return (
            <View style={{ position: 'absolute', width: screenWidth, height: '100%', top: 50 }}>
                <Animated.View style={{ height: this.state.viewHeight }}>
                    {
                        SortCn.map((item, index) => {
                            return (
                                <TouchableHighlight key={index} underlayColor='transparent' onPress={this._hide.bind(this, SortEn[index])}>
                                    <View style={{ backgroundColor: "white", height: 40, borderBottomWidth: 1, borderBottomColor: Theme.lineColor, justifyContent: "space-around", alignItems: 'center', flexDirection: 'row' }}>
                                        <CustomText text={item} style={{color:sort === SortEn[index] ?Theme.theme:null}}/>
                                    </View>
                                </TouchableHighlight>
                            )
                        })
                    }
                </Animated.View>
                <TouchableHighlight style={{ flex: 1 }}>
                    <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}>

                    </View>
                </TouchableHighlight>
            </View>
        )
    }
}
let SortCn = ['默认排序', '价格从低到高', '价格从高到低', '距离从近到远'];
let SortEn = ['Default', 'PriceAsc', 'PriceDesc', 'distanc'];