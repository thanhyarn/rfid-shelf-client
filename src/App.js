import React, { useEffect, useState, useRef } from "react";
import { Card, Table, Typography, Row, Col, Empty, Spin } from "antd";
import SockJS from "sockjs-client";
import "./App.css";

const { Title } = Typography;

const App = () => {
  const [shelves, setShelves] = useState({
    "Shelf 1": [],
    "Shelf 2": [],
    "Shelf 3": [],
    "Shelf 4": [],
  });

  const [loading, setLoading] = useState(false); // Trạng thái loading chung cho tất cả tủ
  const latestDataRef = useRef(null); // Lưu dữ liệu mới nhất nhận được

  // Kết nối WebSocket
  useEffect(() => {
    const sock = new SockJS("http://localhost:8091/echo");

    sock.onopen = () => {
      console.log("Kết nối thành công với server!");
    };

    sock.onmessage = (event) => {
      try {
        const receivedData = JSON.parse(event.data);
        console.log("Dữ liệu nhận được:", receivedData);

        if (receivedData.type === "CUSTOM_SHELF_DATA") {
          // Group data by barcode and calculate quantity
          const groupedData = Object.fromEntries(
            Object.entries(receivedData.data).map(([shelfKey, books]) => [
              shelfKey,
              books.reduce((acc, book) => {
                const existing = acc.find(
                  (item) => item.barcode === book.barcode
                );
                if (existing) {
                  existing.quantity += 1;
                } else {
                  acc.push({ ...book, quantity: 1 });
                }
                return acc;
              }, []),
            ])
          );

          // Lưu dữ liệu mới nhất
          latestDataRef.current = groupedData;

          // Nếu không đang loading, bắt đầu loading
          if (!loading) {
            setLoading(true);
            setTimeout(() => {
              // Sau thời gian loading, cập nhật giao diện với dữ liệu mới nhất
              setShelves(latestDataRef.current);
              setLoading(false); // Tắt trạng thái loading
            }, 2000); // Thời gian loading
          }
        }
      } catch (error) {
        console.error("Lỗi khi phân tích dữ liệu từ server:", error);
      }
    };

    sock.onclose = () => {
      console.log("Đã ngắt kết nối với server");
    };

    return () => {
      sock.close();
    };
  }, [loading]);

  // Cấu hình các cột của bảng
  const columns = [
    {
      title: <span style={{ fontSize: "10px" }}>Tên sách</span>,
      dataIndex: "productName",
      key: "productName",
      width: 120,
      render: (text) => (
        <b style={{ color: "#096dd9", fontSize: "12px" }}>{text}</b>
      ),
    },

    {
      title: <span style={{ fontSize: "10px" }}>Tên tác giả</span>,
      dataIndex: "author",
      key: "author",
      width: 120,
      render: (text) => (
        <i style={{ color: "#722ed1", fontSize: "12px" }}>{text}</i>
      ),
    },
    {
      title: <span style={{ fontSize: "10px" }}>Số lượng</span>,
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
      align: "center",
      render: (text) => (
        <span style={{ color: "#52c41a", fontSize: "12px" }}>{text}</span>
      ),
    },
  ];

  return (
    <div className="container">
      <Title level={3} className="main-title">
        Quản lý tủ sách
      </Title>
      <Row gutter={[16, 16]}>
        {Object.keys(shelves).map((shelfKey) => {
          // Tính tổng số lượng sách
          const totalQuantity = shelves[shelfKey]?.reduce(
            (sum, book) => sum + book.quantity,
            0
          );

          return (
            <Col key={shelfKey} xs={24} sm={24} md={12} lg={12} xl={12}>
              <Card
                title={
                  <>
                    {shelfKey} (
                    <span style={{ color: "#52c41a" }}>
                      {totalQuantity || 0}
                    </span>{" "}
                    sách)
                  </>
                }
                bordered={false}
                className="shelf-card"
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "8px",
                    maxHeight: "300px",
                  }}
                >
                  {loading ? (
                    <div style={{ textAlign: "center", padding: "50px 0" }}>
                      <Spin size="large" />
                    </div>
                  ) : (
                    <Table
                      columns={columns}
                      dataSource={shelves[shelfKey] || []}
                      pagination={false}
                      bordered
                      className="custom-table"
                      scroll={{ y: 200, x: 400 }}
                      locale={{
                        emptyText: <Empty description="Chưa có dữ liệu" />,
                      }}
                    />
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default App;
