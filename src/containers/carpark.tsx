import axios from "axios";
import { useEffect, useState, useRef } from "react";

//internal imports
import "./carpark.css";
import { Card } from "../components/cards";

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
  const totalIndex = carparkArray.length - 1;
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
  const lastIndex = data?.[category].length - 1;
  const highestLot = data?.[category][0]?.lotsAvailable;
  const lowestLot = data[category][lastIndex]?.lotsAvailable;

  const highestLotsCarparkNumber = data?.[category]
    .filter((lot) => lot.lotsAvailable === highestLot)
    .reduce((total, item) => {
      return (total += item?.carparkNumber + ", ");
    }, "");

  const lowestLotsCarparkNumber = data?.[category]
    .filter((lot) => lot.lotsAvailable === lowestLot)
    .reduce((total, item) => {
      return (total += item?.carparkNumber + ", ");
    }, "");
  return {
    highest: {
      lotNumber: highestLot,
      carparkNumber: highestLotsCarparkNumber.slice(0, -1),
    },
    lowest: {
      lotNumber: lowestLot,
      carparkNumber: lowestLotsCarparkNumber.slice(0, -1),
    },
  };
};

export const Carpark: React.FC = () => {
  const [data, setData] = useState<DisplayDataType | undefined>();
  const carparkType: keyof DisplayDataType | any[] = [
    "small",
    "medium",
    "big",
    "large",
  ];
  const API_CALL_INTERVAL_IN_MILLISECONDS = 60000;
  const ref = useRef(false);

  const handlers = {
    getData: async () => {
      await axios
        .get("https://api.data.gov.sg/v1/transport/carpark-availability")
        .then((rs) => {
          let count = 0;
          const dataArray = rs?.data?.items[0]?.carpark_data;
          const dataLength = rs?.data?.items[0]?.carpark_data?.length;
          let calculated = [];

          //loop data
          while (dataLength >= count) {
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
          //sort lots in descending order
          calculated.sort(function (a, b) {
            return b.lotsAvailable - a.lotsAvailable;
          });

          //get indexes and split arrays by category
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
    //render only once at start
    if (ref.current) {
      handlers.getData();
    }
    ref.current = true;

    //start intervals call by 60s interval
    const interval = setInterval(
      handlers.getData,
      API_CALL_INTERVAL_IN_MILLISECONDS
    );

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <h1 className="align-center title">CARPARK AVAILABLE LOTS</h1>
      <div className="card-container">
        {carparkType.map((type: keyof DisplayDataType, index: number) => {
          return (
            data && (
              <div className="card-width" key={index}>
                <Card>
                  <div className="align-center">
                    <h3>{type.toUpperCase()}</h3>
                    <div className="margin-bottom">
                      <b>Highest</b>
                    </div>
                    <div className="number">
                      {typeof data[type]?.highest.lotNumber === "number"
                        ? data[type]?.highest.lotNumber
                        : "-"}
                    </div>
                    {data[type]?.highest.carparkNumber || "-"}
                  </div>
                  <br></br>
                  <br></br>
                  <div className="align-center">
                    <div className="margin-bottom">
                      <b>Lowest</b>
                    </div>

                    <div className="number">
                      {typeof data[type]?.lowest?.lotNumber === "number"
                        ? data[type]?.lowest?.lotNumber
                        : "-"}
                    </div>
                    {data[type]?.lowest?.carparkNumber || "-"}
                  </div>
                </Card>
              </div>
            )
          );
        })}
      </div>
    </>
  );
};
