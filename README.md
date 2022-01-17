# Resize Image API

This is a public open source image resizing project based on AWS.



# Features

- Upload your images **PNG** & ***JPG***.
- Edit the size of the images.
- Image processing in **Eventbridge** & **S3** events.
- Editing of the size of the images already uploaded when you want.


## Package dependency

- [Sharp](https://github.com/lovell/sharp) -> Image service 
- Nanoid -> Id Short

*All services are used with the **serverless framework***.

## Service AWS
AWS service used for the image processing core:
- CloudFront
- S3
- Lambda
- Eventbridge
- Api Gateway

*All services are used with the **serverless framework***.


## Deploy

For the deployment of the application you only need to have serverless installed, clone this repository and then:

    npm install & npm run deploy:production
    
*Wait for package installation, stack upload, deployment, etc.*.

After the deployment it is highly recommended to have the cloudfront domain, look for the outputs, or in the aws console.

# *How does it work?*


## Image Upload
The first step is to upload an image, in this case we will use postman.
`POST - {domainName}/thumbnail/`

![enter image description here](https://i.imgur.com/pZFAaWR.png)


We will upload a simple image and the API will give a response that the image is being processed which you can check out in the hint link. 
	 
All the documents that we want to upload have to send form-data.
	 
The API will reject the request if the uploaded document is not an image type **PNG**, **JPG** or has a weight greater than **5MB**

During processing time, Lambda internally uses **Eventbridge** and native **S3**    events to detect recently uploaded documents.
	```s3:ObjectCreated:Put```
	
Once the function detects the newly uploaded document, the lambda will downsize the images and send them to a new repository of processed files.

Image from the render bucket is copied to the new bucket and deleted.

## Image listing query

Once the events are processed internally and the new images are published to the new repository, the query URL could already be used.
`GET- {domainName}/thumbnail/{name}`

![enter image description here](https://i.imgur.com/5e6ysd9.png)

The lambda returns by default the recommended size and the original size. The urls are pointing to the s3 bucket.

### Image url structure:

 - `{domainName}/resize{height}/{width}/{name}`
 - `{domainName}/resize/orignal/{name}` - Document original

When opening the url, the result is:
![enter image description here](https://i.imgur.com/83RKDxl.png)
![enter image description here](https://i.imgur.com/4UZmu4G.png)

***Oh! the images in a new size.***

## Plus - Dynamic size

For the use of dynamic size of the images, it would only be necessary to change the path of the url, examples:

 `GET - {domainName}/resize/{height}/{width}/{name}`


 - `GET - {domainName}/resize/50/50/{name}`
 
	 ![enter image description here](https://i.imgur.com/xUDyCT8.png)

 - `GET - {domainName}/resize/350/80/{name}`
 
 ![enter image description here](https://i.imgur.com/7tqHKMF.png)

# Comments

 - The image upload endpoint is validated by byte.
 - The whole project is based on typescript.
 - This project does not need any type of configuration to deploy. Infrastructure as code is used.

# Future of the project
This is a small project that was done in less than a day and there are still several topics missing

 - [ ]  Buckets security policy.
 - [ ] CI/CD Deployment.
 - [ ] Dynamic size improvement with response time, currently there is an average of 300ms.
 - [ ] Swagger implementation with run console
 - [ ] Test implementation








*Public domain:   https://d1se8akub48lvs.cloudfront.net*
