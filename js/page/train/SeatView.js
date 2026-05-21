import React from 'react';
import {
    View,
    Image,
    TouchableHighlight,
    StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';
export default class SeatView extends React.Component {

    static propTypes = {
        travellers: PropTypes.array.isRequired,
        employees: PropTypes.array.isRequired,
        ticket: PropTypes.object.isRequired,
        selectSeat: PropTypes.array.isRequired
    }

    _seatSelectBtnClick = (letter, index) => {
        const { selectSeat,travellers, employees,selectSeatFrom } = this.props;
        let arIndex = selectSeat.findIndex(obj => obj === (index + letter));
        if (arIndex > -1) {
            selectSeat.splice(arIndex, 1);
        } else {
            if (((employees || travellers) && (selectSeat.length === employees.length + travellers.length)) || (selectSeatFrom&&selectSeat.length>0)) {
                selectSeat[selectSeat.length - 1] = index + letter;
            } else {
                selectSeat.push(index + letter);
            }
        }
        this.setState({});
    }

    _renderSeat = () => {
        const { ticket, employees,travellers } = this.props;
        if (ticket.train_type === 'C' || ticket.train_type === 'D' || ticket.train_type === 'G') {
            if (ticket.selectedSeat.seat === '无座' || ticket.selectedSeat.seat.includes('卧')) {
                return null;
            }
            let seatLetters = [];
            if (ticket.selectedSeat.seat === '二等座') {
                seatLetters = ['A', 'B', 'C', 'D', 'F'];
            } else if (ticket.selectedSeat.seat === '一等座') {
                seatLetters = ['A', 'C', 'D', 'F'];
            } else if (ticket.selectedSeat.seat === '商务座') {
                seatLetters = ['A', 'C', 'F'];
            }
            if (seatLetters.length === 0) return null;
            return (
                <View style={{ marginTop: 10, backgroundColor: 'white',marginHorizontal:10,borderRadius:6 }}>
                    <View style={{ backgroundColor: Theme.greenBg, padding: 10,borderRadius:6  }}>
                        <CustomText text='优先按指定座席出票，若指定座席无票，将转购其他座席' style={{fontSize:12,color:Theme.commonFontColor}}/>
                    </View>
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', padding: 10, alignItems: 'center' }}>
                            <Image source={require('../../res/Uimage/trainFloder/window.png')} style={{width:26,height:26,marginRight:3}}/>
                            {
                                seatLetters.length === 5 ?
                                    <View style={{ flexDirection: 'row' }}>
                                        {this.SeatItem('A', 1)}
                                        {this.SeatItem('B', 1)}
                                        {this.SeatItem('C', 1)}
                                    </View> :
                                    <View style={{ flexDirection: 'row' }}>
                                        {this.SeatItem('A', 1)}
                                        {this.SeatItem('C', 1)}
                                    </View>

                            }
                            <Image source={require('../../res/Uimage/trainFloder/road.png')} style={{width:26,height:26,marginHorizontal:3}}/>
                            {
                                seatLetters.length > 3 ?
                                    <View style={{ flexDirection: 'row' }}>
                                        {this.SeatItem('D', 1)}
                                        {this.SeatItem('F', 1)}
                                    </View>
                                    : <View>
                                        {this.SeatItem('F', 1)}
                                    </View>

                            }
                            <Image source={require('../../res/Uimage/trainFloder/window.png')} style={{width:26,height:26,marginLeft:3}}/>
                        </View>
                        {
                          (employees || travellers) && (employees.length + travellers.length > 1) ?
                                <View style={{ flexDirection: 'row', padding: 10, alignItems: 'center' }}>
                                    <Image source={require('../../res/Uimage/trainFloder/window.png')} style={{width:26,height:26,marginRight:3}}/>
                                    {
                                        seatLetters.length === 5 ?
                                            <View style={{ flexDirection: 'row' }}>
                                                {this.SeatItem('A', 2)}
                                                {this.SeatItem('B', 2)}
                                                {this.SeatItem('C', 2)}
                                            </View> :
                                            <View style={{ flexDirection: 'row' }}>
                                                {this.SeatItem('A', 2)}
                                                {this.SeatItem('C', 2)}
                                            </View>
                                    }
                                    <Image source={require('../../res/Uimage/trainFloder/road.png')} style={{width:26,height:26,marginHorizontal:3}}/>
                                    {
                                        seatLetters.length > 3 ?
                                            <View style={{ flexDirection: 'row' }}>
                                                {this.SeatItem('D', 2)}
                                                {this.SeatItem('F', 2)}
                                            </View> :
                                            <View>
                                                {this.SeatItem('F', 2)}
                                            </View>
                                    }
                                    <Image source={require('../../res/Uimage/trainFloder/window.png')} style={{width:26,height:26,marginLeft:3}}/>
                                </View>
                                :
                                null
                        }
                    </View>
                </View>
            )
        }

        return null;
    }


    /**
      * 渲染每个座位的
      */
    SeatItem = (letter, index) => {
        const { selectSeat } = this.props;
        let isSelect = false;
        if (selectSeat.indexOf(index + letter) > -1) {
            isSelect = true;
        }
        return (
            <TouchableHighlight underlayColor='transparent' onPress={this._seatSelectBtnClick.bind(this, letter, index)}>
                <View>
                    {
                        letter == 'A' ? <Image style={curStyle.imageStyle} source={isSelect ? require('../../res/image/a.png') : require('../../res/image/seat_A.png')} /> : null
                    }
                    {
                        letter == 'B' ? <Image style={curStyle.imageStyle} source={isSelect ? require('../../res/image/b.png') : require('../../res/image/seat_B.png')} /> : null
                    }
                    {
                        letter == 'C' ? <Image style={curStyle.imageStyle} source={isSelect ? require('../../res/image/c.png') : require('../../res/image/seat_C.png')} /> : null
                    }
                    {
                        letter == 'D' ? <Image style={curStyle.imageStyle} source={isSelect ? require('../../res/image/d.png') : require('../../res/image/seat_D.png')} /> : null
                    }
                    {
                        letter == 'F' ? <Image style={curStyle.imageStyle} source={isSelect ? require('../../res/image/f.png') : require('../../res/image/seat_F.png')} /> : null
                    }
                </View>
            </TouchableHighlight>
        )
    }
    render() {
        return (
            <View>
                {this._renderSeat()}
            </View>
        )
    }
}

const curStyle = StyleSheet.create({
    imageStyle: {
        width: 30,
        height: 30,
        marginHorizontal: 6
    }
})