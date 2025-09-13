import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Fragment } from "react"
import { useLocation } from "react-router-dom"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageBreadcrumbProps {
  items?: BreadcrumbItem[]
}

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  analytics: "Analytics", 
  stations: "Stations",
  management: "Management",
  reports: "Tüm Raporlar",
  users: "Users",
  payments: "Payments",
  transactions: "Transactions",
  billing: "Billing",
  support: "Support",
  feedback: "Feedback",
  profile: "Profile",
  settings: "Settings",
  account: "Account",
  notifications: "Notifications",
  projects: "Projects",
  alpha: "EV Station Alpha",
  beta: "Mobile App Beta",
}

export function PageBreadcrumb({ items }: PageBreadcrumbProps) {
  const location = useLocation()
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items
    
    const pathSegments = location.pathname.split('/').filter(segment => segment !== '')
    
    if (pathSegments.length === 0) {
      return [{ label: "Dashboard", href: "/dashboard" }]
    }
    
    const breadcrumbs: BreadcrumbItem[] = []
    let currentPath = ""
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      
      if (index === pathSegments.length - 1) {
        breadcrumbs.push({ label })
      } else {
        breadcrumbs.push({ label, href: currentPath })
      }
    })
    
    return breadcrumbs
  }
  
  const breadcrumbs = generateBreadcrumbs()
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <Fragment key={index}>
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink href={item.href}>
                  {item.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
