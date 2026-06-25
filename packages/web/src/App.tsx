import { Route, Routes } from 'react-router'
import CourseDetail from './pages/CourseDetail'
import CourseList from './pages/CourseList'

export default function App() {
  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<CourseList />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
        </Routes>
      </div>
      {/* <ScrollRestoration /> */}
    </>
  )
}
