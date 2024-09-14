import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [courses, setCourses] = useState([]);
  const [iframeSrc, setIframeSrc] = useState('');
  const [showCourseList, setShowCourseList] = useState(true);
  const [idToken, setIdToken] = useState('');
  const [expandedCourses, setExpandedCourses] = useState({});

  useEffect(() => {
    if (!idToken) {
      getToken();
    }
    const fetchCourses = async () => {
      try {
        if (idToken) {
          const response = await fetch('https://backend-flask-dot-bosscoderplatformindia.el.r.appspot.com/v4_student/get_course', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id_token: idToken }),
          });
          if (response.ok) {
            const resData = await response.json();
            setCourses(resData.data);
          } else {
            throw new Error('Failed to fetch courses');
          }
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        window.alert('Error fetching courses');
      }
    };

    fetchCourses();
  }, [idToken]);

  const getToken = async () => {
    try {
      const auth = await fetch('https://bosscoderplatformindia.el.r.appspot.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'gpradeepk6@gmail.com',
          password: 'XnCsHTUz',
        }),
      });

      if (auth.ok) {
        const resData = await auth.json();
        setIdToken(resData.data.id_token);
      } else {
        throw new Error('Failed to authenticate');
      }
    } catch (error) {
      console.error('Error fetching token:', error);
      window.alert('Error fetching token');
    }
  };

  const handleViewClick = async (sessionId) => {
    const payload = {
      id_token: idToken,
      session_id: sessionId,
    };

    try {
      const response = await fetch('https://backend-flask-dot-bosscoderplatformindia.el.r.appspot.com/v4_student/get_class_details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const responseData = await response.json();
        if(!responseData.data.is_attended){
          await handleJoinSession({session_id:sessionId}, false);
        }
        const dynamicUrl = `https://vimeo.com/${responseData.data.video_id}/${responseData.data.video_secret}`;
        window.open(dynamicUrl, '_blank', 'noopener noreferrer');
      } else {
        throw new Error('Failed to fetch class details');
      }
    } catch (error) {
      console.error('Error fetching class details:', error);
      window.alert('Error fetching class details');
    }
  };

  const handleBackClick = () => {
    setShowCourseList(true);
    setIframeSrc('');
  };

  const handleJoinSession = async (lecture, markAttendance=true) => {
    try {
      const payload = {
        id_token: idToken,
        session_id: lecture.session_id,
      };
      await fetch('https://backend-flask-dot-bosscoderplatformindia.el.r.appspot.com/v4_student/capture_attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Error in marking attendance:', error);
      window.alert('Error in marking attendance');
    }
    markAttendance && window.open(lecture.class_link, '_blank', 'noopener noreferrer');
  };

  const toggleCourseExpansion = (courseKey) => {
    setExpandedCourses((prevExpandedCourses) => ({
      ...prevExpandedCourses,
      [courseKey]: !prevExpandedCourses[courseKey],
    }));
  };

  return (
    <div className="App">
      <header className="App-header">
        {showCourseList ? (
          <div>
            <h1>Course List</h1>
            {Object.keys(courses).map((courseKey) => {
              const course = courses[courseKey];
              const isExpanded = expandedCourses[courseKey];
              return (
                <div key={courseKey} className="course-section">
                  <h2
                    className="course-title"
                    onClick={() => toggleCourseExpansion(courseKey)}
                  >
                    {course.name}
                  </h2>
                  {isExpanded && (
                    <div className="course-content expanded">
                      <div>
                        <h3>Upcoming Lectures</h3>
                        <div className="table-container">
                          <table>
                            <thead>
                              <tr>
                                <th>Session Name</th>
                                <th>Instructor</th>
                                <th>Date</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {course.upcoming_lectures.map((lecture) => (
                                <tr key={lecture.session_id}>
                                  <td>{lecture.chapter_name}</td>
                                  <td>{lecture.instructor_name}</td>
                                  <td>
                                    {new Date(
                                      lecture.timestamp * 1000
                                    ).toDateString()}
                                  </td>
                                  <td>
                                    {lecture.class_link ? (
                                      <button
                                        onClick={() =>
                                          handleJoinSession(lecture)
                                        }
                                      >
                                        Join
                                      </button>
                                    ) : (
                                      <button disabled>Join</button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div>
                        <h3>Recorded Lectures</h3>
                        <div className="table-container">
                          <table>
                            <thead>
                              <tr>
                                <th>Session Name</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {course.recorded_lectures.map((lecture) => (
                                <tr key={lecture.session_id}>
                                  <td>{lecture.chapter_name}</td>
                                  <td>
                                    <button
                                      onClick={() =>
                                        handleViewClick(lecture.session_id)
                                      }
                                    >
                                      View
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <button onClick={handleBackClick}>Back</button>
            <iframe
              title="course-iframe"
              src={iframeSrc}
              style={{ width: '100%', height: '90vh', border: 'none' }}
            ></iframe>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
