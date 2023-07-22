import "./App.css";
import axios from "axios";
import { useEffect, useState } from "react";

type SortedCarparkType = {
  lotsAvailable: number;
  carparkNumber: string;
};
type CarparkType = {
  small: SortedCarparkType[];
  medium: SortedCarparkType[];
  big: SortedCarparkType[];
  large: SortedCarparkType[];
};
type DataItemType = {
  total_lots: string;
  lot_type: string;
  lots_available: string;
};

type DisplayDataItemType = {
  highest: { lotNumber: number; carparkNumber: string };
  lowest: { lotNumber: number; carparkNumber: string };
};
type DisplayDataType = {
  small: DisplayDataItemType;
  medium: DisplayDataItemType;
  big: DisplayDataItemType;
  large: DisplayDataItemType;
};

const findIndexRanges = (carparkArray: SortedCarparkType[]) => {
  // - small : less than 100 lots
  // - medium : 100 lots or more, but less than 300 lots
  // - big : 300 lots or more, but less than 400 lots
  // - large : 400 lots or more
  const smallIndex = carparkArray.findIndex(
    (item: SortedCarparkType) => item.lotsAvailable < 100
  );
  const mediumIndex = carparkArray.findIndex(
    (item: SortedCarparkType) => item.lotsAvailable < 300
  );
  const bigIndex = carparkArray.findIndex(
    (item: SortedCarparkType) => item.lotsAvailable < 400
  );
  const totalIndex = carparkArray.length;
  return [smallIndex, mediumIndex, bigIndex, totalIndex];
};

const getCarparkListsByCategory = (
  carparkArray: SortedCarparkType[],
  ranges: number[]
) => {
  const small = carparkArray.slice(ranges[0], ranges[3]);
  const medium = carparkArray.slice(ranges[1], ranges[0]);
  const big = carparkArray.slice(ranges[2], ranges[1]);
  const large = carparkArray.slice(ranges[3], ranges[2]);
  return { small, medium, big, large };
};

const formatData = (data: CarparkType, category: keyof CarparkType) => {
  return {
    highest: {
      lotNumber: data?.[category][0]?.lotsAvailable,
      carparkNumber: data?.[category][0]?.carparkNumber,
    },
    lowest: {
      lotNumber: data?.[category]?.reduce(
        (total, item, index) =>
          index !== 1 ? (total += item?.lotsAvailable) : total,
        0
      ),
      carparkNumber: data?.[category]?.reduce(
        (total, item, index) =>
          index !== 1 ? (total += item?.carparkNumber + ", ") : "",
        ""
      ),
    },
  };
};

const App: React.FC = () => {
  const [data, setData] = useState<DisplayDataType | undefined>();

  const handlers = {
    getData: async () => {
      await axios
        .get("https://api.data.gov.sg/v1/transport/carpark-availability")
        .then((rs) => {
          console.log(rs);
          let count = 0;
          const dataArray = rs?.data?.items[0]?.carpark_data;
          const dataLength = rs?.data?.items[0]?.carpark_data?.length;
          let calculated = [];
          while (15 >= count) {
            const totalLotsAvailable = dataArray[count]?.carpark_info.reduce(
              (total: number, carparkItem: DataItemType) =>
                (total += Number(carparkItem?.lots_available)),
              0
            );
            calculated.push({
              lotsAvailable: totalLotsAvailable,
              carparkNumber: dataArray[count]?.carpark_number,
            });
            count++;
          }
          calculated.sort(function (a, b) {
            return b.lotsAvailable - a.lotsAvailable;
          });
          const indexRanges: number[] = findIndexRanges(calculated);
          const carparkCategories: CarparkType = getCarparkListsByCategory(
            calculated,
            indexRanges
          );
          setData({
            small: formatData(carparkCategories, "small"),
            medium: formatData(carparkCategories, "medium"),
            big: formatData(carparkCategories, "big"),
            large: formatData(carparkCategories, "large"),
          });
        });
    },
  };

  useEffect(() => {
    handlers.getData();
  }, []);

  return <div></div>;
};

export default App;
