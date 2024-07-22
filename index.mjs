import axios  from 'axios';
// const {XMLParser} = require('fast-xml-parser');
import {XMLParser} from 'fast-xml-parser';
// const _ = require('lodash');
import _ from 'lodash';

class Landmark {
    constructor() {
        this.FULL_ADDR = '';
        this.X = '';
        this.Y = '';
    }
}

async function getRestQuery(landmark) {
    const url = `https://api.nlsc.gov.tw/idc/TextQueryMap`;
    const urlString = url + "/" + encodeURIComponent(landmark);
    console.log("call landmark url:" + urlString);

    try {
        const response = await axios.get(urlString, {
            timeout: 16000,
            headers: {"Referer": "https://twm.water.gov.taipei/"}
        });

        if (response.status !== 200) {
            console.error('Failed to get the data, status code: ', response.status);
            return null;
        }

        const parser = new XMLParser();
        let jObj = parser.parse(response.data);

        let lists = [];
        if (jObj && jObj.root && jObj.root.ITEM) {
            if (_.isArray(jObj.root.ITEM)) {
                // map jObj.root.ITEM to Landmark
                lists = jObj.root.ITEM.map((item) => {
                    let landmark = new Landmark();
                    landmark.FULL_ADDR = item.CONTENT;
                    landmark.X = item.LOCATION.split(',')[0];
                    landmark.Y = item.LOCATION.split(',')[1];
                    return landmark;
                });
            } else {
                const item = jObj.root.ITEM;
                let landmark = new Landmark();
                landmark.FULL_ADDR = item.CONTENT;
                landmark.X = item.LOCATION.split(',')[0];
                landmark.Y = item.LOCATION.split(',')[1];
                lists.push(landmark);
            }
        }

        return lists;
    } catch (err) {
        console.error(`error: ${err.message}`, {
            metadata: {
                message: err.message,
                line: (err.lineNumber || err.line),
                stack: (err.stackTrace || err.stack)
            }
        });
    }
    return null;
}


export const handler = async (event) => {
    const landmark = event.queryStringParameters.landmark;
    // if landmark is empty, return empty array
    if (!landmark) {
        return {
            statusCode: 200,
            body: JSON.stringify({ result: [] }),
        };
    }
    const result = await getRestQuery(landmark);
    // console.log(`getRestQuery 結果`, JSON.stringify(result));
    console.log(`getRestQuery 結果`, (result));

    // Map each result into desired format
    const items = result.map(res => ({
        addr: res.FULL_ADDR,
        x: res.X,
        y: res.Y
    }));

    const response = {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json"
        },
       body: JSON.stringify({items} ),
//         body:  result ,
    };
    return response;
};