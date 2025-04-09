import React, { useState, useEffect } from 'react';
import { Card, Spin, Typography, Input, Button, Badge, Avatar, Breadcrumb } from 'antd';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Rocket, Search, ChevronDown, ChevronUp } from 'lucide-react';
import moment from 'moment';

const { Title, Text } = Typography;
const { Search: AntSearch } = Input;

interface Launch {
  flight_number: number;
  mission_name: string;
  launch_date_utc: string;
  details: string;
  links: {
    mission_patch: string;
    video_link: string | null;
    article_link: string | null;
  };
  upcoming: boolean;
  launch_success: boolean | null;
}


function App() {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedLaunches, setExpandedLaunches] = useState<number[]>([]);

  const fetchLaunches = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const response = await fetch(`https://api.spacexdata.com/v3/launches?limit=10&offset=${(currentPage - 1) * 10}`);
      const data = await response.json();
      console.log(data, 'test')
      
      if (data.length < 10) {
        setHasMore(false);
      }
      
      const filteredData = data.filter((launch: Launch) => 
        launch.mission_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (launch.details?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      );

      setLaunches(prevLaunches => reset ? filteredData : [...prevLaunches, ...filteredData]);
      setPage(prevPage => reset ? 2 : prevPage + 1);
    } catch (error) {
      console.error('Error fetching launches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaunches(true);
  }, [searchQuery]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setHasMore(true);
  };

  const toggleDetails = (flightNumber: number) => {
    setExpandedLaunches(prev => 
      prev.includes(flightNumber)
        ? prev.filter(num => num !== flightNumber)
        : [...prev, flightNumber]
    );
  };

  const getLaunchStatus = (launch: Launch) => {
    if (launch.upcoming) {
      return { status: 'processing', text: 'Upcoming' };
    }
    if (launch.launch_success === true) {
      return { status: 'success', text: 'Success' };
    }
    if (launch.launch_success === false) {
      return { status: 'error', text: 'Failed' };
    }
    return { status: 'default', text: 'Unknown' };
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Rocket size={32} className="text-blue-500" />
          <Title level={2} style={{ margin: 0 }}>SpaceX Launches</Title>
        </div>

        <div className="mb-6">
          <AntSearch
            placeholder="Search launches by mission name or details..."
            allowClear
            enterButton={<Search size={20} />}
            size="large"
            onChange={e => handleSearch(e.target.value)}
            className="max-w-full"
          />
        </div>

        {loading && launches.length === 0 ? (
          <div className="text-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <InfiniteScroll
            dataLength={launches.length}
            next={fetchLaunches}
            hasMore={hasMore}
            loader={
              <div className="text-center py-4">
                <Spin size="large" />
              </div>
            }
            endMessage={
              <div className="text-center py-4">
                <Text type="secondary">
                  {launches.length === 0 
                    ? 'No launches found matching your search'
                    : 'End of List.'}
                </Text>
              </div>
            }
          >
            <div className="space-y-4">
              {launches.map((launch) => {
                const status = getLaunchStatus(launch);
                return (
                <Card key={launch.flight_number} className="shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                        <div className="flex items-center gap-2 mb-1">
                              <Title level={4} style={{ margin: 0 }}>{launch.mission_name}</Title>
                              <Badge 
                                status={status.status as any} 
                                text={status.text}
                                className="relative top-[2px]"
                              />
                            </div>
                           
                        </div>
                      </div>
                      {expandedLaunches.includes(launch.flight_number) && (
                        <>
                         <div className='flex gap-2'>
                         <Text type="secondary" className="block mb-2">
                           {moment(launch.launch_date_utc).fromNow()} |
                         </Text>
                         <Breadcrumb
                             separator="|"
                             items={[
                               ...(launch.links.video_link ? [{
                                 title: (
                                   <a
                                   href={launch.links.video_link}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="flex items-center gap-1 text-blue-500 hover:text-blue-700 underline"
                                 >
                                   Video
                                 </a>
                                 ),
                               }] : []),
                               ...(launch.links.article_link ? [{
                                 title: (
                                   <a 
                                     href={launch.links.article_link} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     className="flex items-center gap-1 text-blue-500 hover:text-blue-700 underline"
                                   >
                                     Article
                                   </a>
                                 ),
                               }] : []),
                             ]}
                           />
                        </div>
                        <div className="mt-4 pt-4 flex gap-6 items-center">
                            {launch.links.mission_patch && (
                              <img 
                                src={launch.links.mission_patch} 
                                alt={`${launch.mission_name} patch`}
                                className="w-20 h-20 object-contain"
                              />
                            )}
                          <Text>{launch.details || 'No details available'}</Text>
                        </div>
                        </>
                      )}
                      <Button 
                          onClick={() => toggleDetails(launch.flight_number)}
                          className="flex items-center gap-1 bg-blue-300 text-white hover:bg-blue-400 transition-colors mt-2"
                        >
                          {expandedLaunches.includes(launch.flight_number) ? (
                            <> Hide Details </>
                          ) : (
                            <> Show Details</>
                          )}
                        </Button>
                    </div>
                  </div>
                </Card>
              )})}
            </div>
          </InfiniteScroll>
        )}
      </div>
    </div>
  );
}

export default App;